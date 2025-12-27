import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Swords, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <Swords className="w-20 h-20 mx-auto text-primary opacity-50" />
        </div>
        <h1 className="mb-4 text-6xl font-display font-black text-primary text-glow">404</h1>
        <p className="mb-2 text-xl font-display font-bold">ARENA NOT FOUND</p>
        <p className="mb-8 text-muted-foreground font-body">
          The battle you're looking for doesn't exist.
        </p>
        <Link to="/">
          <Button className="font-display bg-primary hover:bg-primary/90">
            <Home className="w-4 h-4 mr-2" />
            RETURN HOME
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
