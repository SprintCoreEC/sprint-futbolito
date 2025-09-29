import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BackButton } from "@/components/ui/back-button";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  customHeader?: React.ReactNode;
}

export function MainLayout({ children, title, subtitle, customHeader }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {customHeader ? (
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              {customHeader}
            </div>
          </div>
        ) : (
          <Header title={title} subtitle={subtitle} />
        )}
        
        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {!customHeader && <BackButton />}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
