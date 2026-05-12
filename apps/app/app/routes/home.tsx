import { Camera, Link as LinkIcon, QrCode, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@lumina/ui/components/ui/button";

export default function Home() {
  const navigate = useNavigate();
  const [eventLink, setEventLink] = useState("");

  const handleContinue = () => {
    const value = eventLink.trim();
    if (!value) return;

    try {
      const normalized = value.startsWith("http")
        ? value
        : `https://${value.replace(/^\/+/, "")}`;
      const url = new URL(normalized);
      const pathToken = url.pathname.match(/\/e\/([^/?#]+)/)?.[1];
      const token = pathToken || value.replace(/^\/?e\//, "");

      if (token) {
        navigate(`/e/${token.trim()}`);
      }
    } catch {
      // No-op: keep user on page with current input
    }
  };

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 px-4 py-6 sm:py-8 md:py-14">
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 md:space-y-14">
        <header className="text-center space-y-4 md:space-y-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-sage/10 text-sage text-xs font-black uppercase tracking-widest border border-sage/20">
            <Sparkles className="w-3 h-3 mr-2" />
            Friendly Event Experience
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white text-balance">
            Find Your Event Photos in Seconds
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-lg max-w-xl mx-auto text-pretty">
            Open your event link, take a selfie, and instantly discover every photo you are in.
          </p>
        </header>

        <section className="rounded-[2rem] md:rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-5 md:p-8 space-y-4 shadow-xl">
          <label htmlFor="event-link" className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Paste event link
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <LinkIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="event-link"
                type="text"
                value={eventLink}
                onChange={(e) => setEventLink(e.target.value)}
                placeholder="https://.../e/your-event-token"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full h-14 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 pl-11 pr-4 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-sage/50"
              />
            </div>
            <Button
              size="lg"
              className="h-14 w-full sm:w-auto rounded-2xl px-8 bg-sage text-zinc-950 hover:bg-sage/90"
              onClick={handleContinue}
              disabled={!eventLink.trim()}
            >
              Open Event
            </Button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tip: You can also scan the event QR code to open this page directly.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
          {[
            { icon: <QrCode className="w-5 h-5 text-sage" />, title: "Join from QR", body: "Open the shared QR code from the event host." },
            { icon: <Camera className="w-5 h-5 text-sage" />, title: "Take a Selfie", body: "Use camera or upload a clear face photo." },
            { icon: <Sparkles className="w-5 h-5 text-sage" />, title: "Get Matches", body: "Instantly view photos where you appear." },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[1.75rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center">{item.icon}</div>
              <h2 className="font-bold text-zinc-900 dark:text-white">{item.title}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.body}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
