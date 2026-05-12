import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Heart, Download, Share2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePreviewModalProps {
  image: any | null;
  images: any[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (image: any) => void;
  onReaction?: (imageId: string) => void;
  reactionCount?: number;
}

export const ImagePreviewModal = ({
  image,
  images,
  isOpen,
  onClose,
  onNavigate,
  onReaction,
  reactionCount = 0,
}: ImagePreviewModalProps) => {
  const [isReacting, setIsReacting] = useState(false);

  const currentIndex = image ? images.findIndex((img) => img.imageId === image.imageId) : -1;
  const hasNext = currentIndex !== -1 && currentIndex < images.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = useCallback(() => {
    if (hasNext) onNavigate(images[currentIndex + 1]);
  }, [hasNext, currentIndex, images, onNavigate]);

  const handlePrev = useCallback(() => {
    if (hasPrev) onNavigate(images[currentIndex - 1]);
  }, [hasPrev, currentIndex, images, onNavigate]);

  const handleReaction = () => {
    if (!image) return;
    setIsReacting(true);
    onReaction?.(image.imageId);
    setTimeout(() => setIsReacting(false), 1000);
  };

  const handleDownload = () => {
    if (!image) return;
    const link = document.createElement("a");
    link.href = image.imagePath;
    link.download = `lumina-${image.imageId}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || !image) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, image, handleNext, handlePrev, onClose]);

  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl h-auto max-h-[90vh] p-0 overflow-hidden bg-black border-none rounded-[2rem] z-[110]" showCloseButton={false}>
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <DialogDescription className="sr-only">
          View and interact with the selected event photo.
        </DialogDescription>

        {/* Close Button - Fixed position outside content */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 z-50 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all active:scale-90"
        >
          <X size={20} />
        </button>

        <div className="relative w-full flex flex-col z-10">
          {/* Main Image */}
          <div className="relative w-full max-h-[60vh] flex items-center justify-center bg-zinc-950/50 backdrop-blur-3xl overflow-hidden">
            <img
              src={image.imagePath}
              alt="Preview"
              className="max-w-full max-h-[60vh] object-contain"
            />

            {/* Navigation Controls */}
            {hasPrev && (
              <button
                onClick={handlePrev}
                className="absolute left-4 z-20 p-3 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md border border-white/10 transition-all active:scale-90"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            {hasNext && (
              <button
                onClick={handleNext}
                className="absolute right-4 z-20 p-3 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md border border-white/10 transition-all active:scale-90"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-6 md:p-8 bg-zinc-900/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-between z-20">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "rounded-2xl border-white/10 text-white hover:bg-white/10 bg-white/5",
                  isReacting && "scale-110 text-plum border-plum/30"
                )}
                onClick={handleReaction}
              >
                <Heart size={20} className={cn("mr-2", (isReacting || reactionCount > 0) && "fill-current text-plum")} />
                {reactionCount > 0 ? reactionCount : ""}
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="rounded-2xl border-white/10 text-white hover:bg-white/10 bg-white/5 w-12 h-12"
                onClick={handleDownload}
              >
                <Download size={20} />
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="rounded-2xl px-6"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Check out my photo from Lumina!",
                      url: window.location.href,
                    });
                  }
                }}
              >
                <Share2 size={20} className="mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
