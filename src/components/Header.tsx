import { Link } from "react-router-dom";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-2">
            <Ticket className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Crevin Tickets</span>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost">Eventos</Button>
          </Link>
          <Link to="/admin">
            <Button variant="outline">Admin</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};
