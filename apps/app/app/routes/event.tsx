import { useState, useRef, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Image as ImageIcon, Sparkles, Heart, Trophy, Scan } from "lucide-react";
import { Button } from "@lumina/ui/components/ui/button";
import { ImageGrid } from "@lumina/ui/components/domain/ImageGrid";
import { ImagePreviewModal } from "@lumina/ui/components/domain/ImagePreviewModal";
import { SkeletonImageGrid } from "@lumina/ui/components/domain/Skeleton";
import { InAppCamera } from "~/components/InAppCamera";
import { api } from "~/utils/eden";
import { useLiveAlbum } from "~/hooks/useLiveAlbum";
import toast from "react-hot-toast";

export default function EventPage() {
  const { token } = useParams<{ token: string }>();
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (selectedImage) {
      console.log("[Event] Image selected for preview:", selectedImage.imageId);
    }
  }, [selectedImage]);

  // Fetch Album Details
  const { data: albumData, isLoading: isAlbumLoading } = useQuery({
    queryKey: ["album", token],
    queryFn: async () => {
      const res = await api.public.albums[token as string].get();
      if (res.error) throw res.error;
      return res.data?.data;
    },
    enabled: !!token,
  });

  const albumId = albumData?.id;
  const { reactions: liveReactions } = useLiveAlbum(albumId);

  // Fetch Highlights (Trending)
  const { data: highlightsData, isLoading: isHighlightsLoading } = useQuery({
    queryKey: ["album-highlights", token],
    queryFn: async () => {
      const res = await api.public.albums[token as string].highlights.get();
      if (res.error) throw res.error;
      return res.data?.data;
    },
    enabled: !!token,
  });

  // Selfie Search Mutation
  const searchMutation = useMutation({
    mutationFn: async (file: File) => {
      const res = await api.public.albums[token as string]["search-by-image"].post({
        selfie: file,
      });
      if (res.error) throw res.error;
      return res.data?.data;
    },
    onSuccess: (data) => {
      if (data) {
        toast.success(`Found ${data.length} photos of you!`);
      }
    },
    onError: (error: any) => {
      console.error("Search failed:", error);
      toast.error(error.message || "Face search failed. Try another photo.");
    },
  });

  // Reaction Mutation
  const reactMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const res = await api.v1.reactions.post({
        imageId,
        type: "HEART",
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["album-highlights", token] });
    }
  });

  const handleCapture = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelfiePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    searchMutation.mutate(file);
  };

  const images = useMemo(() => {
    const searchResults = searchMutation.data || [];
    const highlights = highlightsData || [];
    return searchMutation.data ? searchResults : highlights;
  }, [searchMutation.data, highlightsData]);
  
  const isNoMatchesState = !!searchMutation.data && images.length === 0;

  // Combine live reactions with initial data
  const mergedReactions = useMemo(() => {
    const base: Record<string, number> = {};
    if (highlightsData) {
      highlightsData.forEach((img: any) => {
        base[img.imageId] = img.reactionCount || 0;
      });
    }
    if (searchMutation.data) {
      searchMutation.data.forEach((img: any) => {
        base[img.imageId] = img.reactionCount || 0;
      });
    }
    return { ...base, ...liveReactions };
  }, [highlightsData, searchMutation.data, liveReactions]);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12 space-y-10 md:space-y-12">
      {isAlbumLoading ? (
        <div className="p-6 space-y-6">
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg" />
          <SkeletonImageGrid count={12} />
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <header className="text-center space-y-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-sage/10 text-sage text-xs font-black uppercase tracking-widest border border-sage/20">
              <Sparkles className="w-3 h-3 mr-2" />
              Live Event Gallery
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white px-2 sm:px-4 text-balance break-words">
              {albumData?.albumName || "Event Gallery"}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto px-4 sm:px-6 text-pretty">
              Take a selfie and let our AI find every photo you're in, instantly.
            </p>
          </header>

          {/* Action Section */}
          <div className="flex flex-col items-center justify-center space-y-6 px-4">
            {!searchMutation.data ? (
              <Button 
                size="lg" 
                className="w-full sm:w-auto h-16 sm:h-20 px-6 sm:px-10 rounded-[2rem] sm:rounded-[2.5rem] text-lg sm:text-xl shadow-2xl shadow-sage/30 hover:scale-105 transition-transform bg-sage hover:bg-sage/90 text-zinc-950 border-none"
                onClick={() => setIsCameraOpen(true)}
                disabled={searchMutation.isPending}
              >
                {searchMutation.isPending ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    Finding you...
                  </div>
                ) : (
                  <>
                    <Scan className="w-6 h-6 mr-3" />
                    Find My Photos
                  </>
                )}
              </Button>
            ) : (
              <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                  <img 
                    src={selfiePreview!} 
                    alt="Selfie" 
                    className="w-24 h-24 rounded-[2rem] object-cover border-4 border-sage shadow-2xl"
                  />
                  <button 
                    onClick={() => setIsCameraOpen(true)}
                    className="absolute -bottom-1 -right-1 p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 hover:scale-110 transition-transform"
                  >
                    <Camera className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </button>
                </div>
                <div className="flex flex-col items-center">
                   <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tighter">Matched Results</p>
                   <Button variant="link" size="sm" onClick={() => {
                     searchMutation.reset();
                     setSelfiePreview(null);
                   }} className="text-zinc-400 h-auto p-0">
                     Clear & view highlights
                   </Button>
                </div>
              </div>
            )}
          </div>

          {/* Gallery Section */}
          <section className="space-y-8">
            <div className="flex items-center justify-between gap-2 px-2">
              <div className="flex items-center gap-3">
                {!searchMutation.data ? (
                  <div className="p-2 bg-sage/10 rounded-xl">
                     <Trophy className="w-5 h-5 text-sage" />
                  </div>
                ) : (
                  <div className="p-2 bg-plum/10 rounded-xl">
                     <Heart className="w-5 h-5 text-plum" />
                  </div>
                )}
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight break-words">
                  {searchMutation.data ? "Photos of You" : "Event Highlights"}
                </h3>
              </div>
              <span className="hidden sm:inline-flex px-3 py-1 bg-zinc-100 dark:bg-zinc-900 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest shrink-0">
                {searchMutation.data ? `${images.length} results` : "Trending Now"}
              </span>
            </div>

            {searchMutation.isPending || isHighlightsLoading ? (
              <SkeletonImageGrid count={8} />
            ) : images.length > 0 ? (
              <div className="px-2">
                <ImageGrid 
                  images={images}
                  reactions={mergedReactions}
                  onReaction={(id) => reactMutation.mutate(id)}
                  onImageClick={(img) => {
                    console.log("[Event] Image clicked:", img.imageId);
                    setSelectedImage(img);
                  }}
                />
              </div>
            ) : isNoMatchesState ? (
              <div className="p-8 md:p-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 mx-2 space-y-5">
                <ImageIcon className="w-12 h-12 md:w-16 md:h-16 mx-auto text-zinc-300 mb-2" />
                <div className="space-y-2 max-w-sm mx-auto">
                  <p className="text-zinc-700 dark:text-zinc-200 font-bold text-base md:text-lg">No face matches yet</p>
                  <p className="text-zinc-500 font-medium text-sm md:text-base">
                    Try a clear front-facing selfie with good lighting and minimal obstructions.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                  <Button
                    onClick={() => setIsCameraOpen(true)}
                    className="w-full sm:w-auto rounded-2xl bg-sage text-zinc-950 hover:bg-sage/90 px-6"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Retake Selfie
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      searchMutation.reset();
                      setSelfiePreview(null);
                    }}
                    className="w-full sm:w-auto rounded-2xl"
                  >
                    View Highlights Instead
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-10 md:p-20 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 mx-2">
                <ImageIcon className="w-12 h-12 md:w-16 md:h-16 mx-auto text-zinc-200 mb-6" />
                <p className="text-zinc-500 font-medium max-w-[200px] md:max-w-xs mx-auto text-sm md:text-base">The gallery is empty or face search failed to find matches.</p>
              </div>
            )}
          </section>
        </>
      )}

      {/* Viral Footnote */}
      <footer className="pt-16 sm:pt-20 pb-[max(env(safe-area-inset-bottom),2rem)] border-t border-zinc-100 dark:border-zinc-800 text-center px-4">
        <p className="text-xs md:text-sm text-zinc-400 flex items-center justify-center gap-2">
          Experience by <span className="font-black text-zinc-900 dark:text-white tracking-tighter">LUMINA</span> • Shared with <Heart className="w-3 h-3 text-plum fill-plum animate-pulse" />
        </p>
      </footer>

      {/* In-App Camera Modal */}
      <InAppCamera
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
      />

      {/* Image Preview */}
      <ImagePreviewModal
        image={selectedImage}
        images={images}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        onNavigate={(img) => setSelectedImage(img)}
        onReaction={(id) => reactMutation.mutate(id)}
        reactionCount={selectedImage ? mergedReactions[selectedImage.imageId] : 0}
      />
    </div>
  );
}
