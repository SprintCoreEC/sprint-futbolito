import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Publication } from "@shared/schema";

export function RecentPublications() {
  const { data: response, isLoading } = useQuery<{ success: boolean; data: Publication[] }>({
    queryKey: ["/api/publications"],
    enabled: true,
  });

  const publications = response?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Publicaciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-4 p-4 bg-muted/50 rounded-lg animate-pulse">
                <div className="w-16 h-16 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayPublications = publications.slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle data-testid="text-publications-title">Publicaciones Recientes</CardTitle>
        <Button 
          data-testid="button-view-all-publications"
          variant="link" 
          className="text-primary hover:text-primary/80 text-sm font-medium"
        >
          Ver todas
        </Button>
      </CardHeader>
      <CardContent>
        {displayPublications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay publicaciones recientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayPublications.map((publication, index) => (
              <div key={publication.id} className="flex space-x-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">📄</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p 
                    data-testid={`publication-title-${index}`}
                    className="text-sm font-medium text-foreground"
                  >
                    {publication.title}
                  </p>
                  <p 
                    data-testid={`publication-content-${index}`}
                    className="text-sm text-muted-foreground line-clamp-2"
                  >
                    {publication.content}
                  </p>
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <span data-testid={`publication-scope-${index}`}>
                      {publication.visibility === 'global' ? 'Toda la institución' : 
                       publication.visibility === 'sede' ? 'Sede' : 'Grupo'}
                    </span>
                    <span className="mx-2">•</span>
                    <span data-testid={`publication-time-${index}`}>
                      {new Date(publication.createdAt!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
