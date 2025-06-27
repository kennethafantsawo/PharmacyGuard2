import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminPanel from "@/components/admin-panel";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function Admin() {
  const { isAuthenticated } = useAdminAuth();

  return (
    <div className="pwa-container">
      {isAuthenticated && (
        <header className="bg-primary text-primary-foreground p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Administration</h1>
          </div>
        </header>
      )}

      <div className={isAuthenticated ? "p-4" : ""}>
        <AdminPanel isOpen={true} onClose={() => {}} standalone />
      </div>
    </div>
  );
}
