import { Button } from './ui/button';

export default function HeroButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button size="lg">
        Get Started
      </Button>
      <Button variant="outline" size="lg">
        Browse Recipes
      </Button>
    </div>
  );
} 