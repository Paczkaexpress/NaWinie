import React from "react";
import type { RecipeListItemDto } from "../types";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Clock, 
  Star, 
  Users, 
  Play, 
  Heart, 
  Share2,
  ChefHat
} from "lucide-react";

export interface RecipeCardProps {
  recipe: RecipeListItemDto;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
      onClick={() => (window.location.href = `/recipes/${recipe.id}`)}
    >
      {/* Image Section */}
      <div className="relative aspect-video bg-gradient-to-br from-orange-100 to-yellow-100 overflow-hidden">
        {recipe.image_data ? (
          <img
            src={recipe.image_data}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Placeholder content */
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
            <div className="text-center text-muted-foreground">
              <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-MEDIUM">Zdjęcie przepisu</p>
            </div>
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="lg" className="rounded-full h-16 w-16 p-0">
            <Play className="h-6 w-6 ml-1" fill="currentColor" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-black/60 text-white border-0">
            <Clock className="h-3 w-3 mr-1" />
            {recipe.preparation_time_minutes} min
          </Badge>
        </div>

        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-black/60 text-white border-0">
            <Star className="h-3 w-3 mr-1 text-yellow-400" fill="currentColor" />
            {recipe.average_rating ? recipe.average_rating.toFixed(1) : '0.0'}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {recipe.name}
        </h3>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{recipe.preparation_time_minutes}'</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>4</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500" fill="currentColor" />
            <span className="font-MEDIUM">
              {recipe.average_rating ? recipe.average_rating.toFixed(1) : '0.0'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeCard; 