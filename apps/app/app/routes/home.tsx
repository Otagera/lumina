import { Button } from "@lumina/ui/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <h1 className="text-4xl font-bold text-sage">Lumina Consumer App</h1>
      <p className="text-zinc-500">Welcome to the future of event photography.</p>
      <Button variant="primary">Get Started</Button>
    </div>
  );
}
