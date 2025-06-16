// Mock database for testing
export const db = {
  user: {
    create: (userData: any) => userData,
    findFirst: (query: any) => null,
    findMany: (query: any) => [],
    update: (params: any) => null,
    delete: (params: any) => null,
  },
  recipe: {
    create: (recipeData: any) => recipeData,
    findFirst: (query: any) => null,
    findMany: (query: any) => [],
    update: (params: any) => null,
    delete: (params: any) => null,
  },
  rating: {
    create: (ratingData: any) => ratingData,
    findFirst: (query: any) => null,
    findMany: (query: any) => [],
    update: (params: any) => null,
    delete: (params: any) => null,
  },
  storedFile: {
    create: (fileData: any) => fileData,
    findFirst: (query: any) => null,
    findMany: (query: any) => [],
    update: (params: any) => null,
    delete: (params: any) => null,
  }
}; 