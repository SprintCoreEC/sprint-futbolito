import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Publication } from "@shared/schema";
import { Plus, Megaphone, Search, Filter, Eye, Edit, Trash2, Globe, Building2, Users } from "lucide-react";
import { useState } from "react";

export default function Publications() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: response, isLoading } = useQuery<{ success: boolean; data: Publication[] }>({
    queryKey: ["/api/publications"],
    enabled: true,
  });

  const publications = response?.data || [];

  const filteredPublications = publications.filter(publication =>
    publication.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    publication.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <MainLayout title="Publicaciones" subtitle="Gestión de publicaciones y comunicaciones">
        <div className="space-y-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    <div className="w-16 h-16 bg-muted rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'global':
        return <Globe className="w-4 h-4" />;
      case 'sede':
        return <Building2 className="w-4 h-4" />;
      case 'grupo':
        return <Users className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'global':
        return 'Toda la institución';
      case 'sede':
        return 'Sede específica';
      case 'grupo':
        return 'Grupo específico';
      default:
        return 'Global';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'publicada':
        return 'default';
      case 'programada':
        return 'secondary';
      case 'borrador':
        return 'outline';
      case 'oculta':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <MainLayout title="Publicaciones" subtitle="Gestión de publicaciones y comunicaciones">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Publicaciones</h2>
            <p className="text-muted-foreground">
              Crea y gestiona publicaciones para tu comunidad deportiva
            </p>
          </div>
          <Button data-testid="button-create-publication">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Publicación
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              data-testid="input-search-publications"
              placeholder="Buscar publicaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" data-testid="button-filter-publications">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Publications List */}
        <div className="space-y-4">
          {filteredPublications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? "No se encontraron publicaciones" : "No hay publicaciones creadas"}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm 
                    ? "Intenta con otros términos de búsqueda"
                    : "Comienza creando tu primera publicación para compartir con tu comunidad"
                  }
                </p>
                {!searchTerm && (
                  <Button data-testid="button-create-first-publication">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Publicación
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredPublications.map((publication, index) => (
              <Card key={publication.id} data-testid={`publication-card-${index}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    {/* Publication Icon/Image */}
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Megaphone className="w-8 h-8 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Header with status and visibility */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={getStatusColor(publication.status || 'borrador')}
                            data-testid={`publication-status-${index}`}
                          >
                            {publication.status === 'publicada' ? 'Publicada' : 
                             publication.status === 'programada' ? 'Programada' :
                             publication.status === 'borrador' ? 'Borrador' : 'Oculta'}
                          </Badge>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            {getVisibilityIcon(publication.visibility)}
                            <span data-testid={`publication-visibility-${index}`}>
                              {getVisibilityLabel(publication.visibility)}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-view-publication-${index}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-edit-publication-${index}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-delete-publication-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 
                        data-testid={`publication-title-${index}`}
                        className="text-lg font-semibold text-foreground mb-2"
                      >
                        {publication.title}
                      </h3>

                      {/* Content preview */}
                      <p 
                        data-testid={`publication-content-${index}`}
                        className="text-sm text-muted-foreground line-clamp-3 mb-3"
                      >
                        {publication.content}
                      </p>

                      {/* Media preview */}
                      {publication.mediaUrls && Array.isArray(publication.mediaUrls) && publication.mediaUrls.length > 0 && (
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge variant="secondary">
                            {publication.mediaUrls.length} archivo{publication.mediaUrls.length > 1 ? 's' : ''} adjunto{publication.mediaUrls.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      )}

                      {/* Footer info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <span data-testid={`publication-author-${index}`}>
                            Por Admin Sistema
                          </span>
                          <span data-testid={`publication-date-${index}`}>
                            {publication.publishAt 
                              ? `Programada para: ${new Date(publication.publishAt).toLocaleDateString()}`
                              : `Creada: ${new Date(publication.createdAt!).toLocaleDateString()}`
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                            👁️ 124 vistas
                          </span>
                          <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">
                            ❤️ 15 reacciones
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        {filteredPublications.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-total-publications" className="text-2xl font-bold text-foreground">
                  {filteredPublications.length}
                </p>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-published" className="text-2xl font-bold text-foreground">
                  {filteredPublications.filter(p => p.status === 'publicada').length}
                </p>
                <p className="text-sm text-muted-foreground">Publicadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-drafts" className="text-2xl font-bold text-foreground">
                  {filteredPublications.filter(p => p.status === 'borrador').length}
                </p>
                <p className="text-sm text-muted-foreground">Borradores</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-scheduled" className="text-2xl font-bold text-foreground">
                  {filteredPublications.filter(p => p.status === 'programada').length}
                </p>
                <p className="text-sm text-muted-foreground">Programadas</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
