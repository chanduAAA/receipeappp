// API Keys
const SPOONACULAR_API_KEY = "YOUR_API_KEY_HERE"; // Same as in script.js
const YOUTUBE_API_KEY = "YOUR_YOUTUBE_API_KEY_HERE"; // Get from Google Cloud Console
const SPOONACULAR_BASE_URL = "https://api.spoonacular.com/recipes";

// Get recipe ID from URL
const urlParams = new URLSearchParams(window.location.search);
const recipeId = urlParams.get("id");

// DOM elements
const loadingSpinner = document.getElementById("loadingSpinner");
const recipeDetail = document.getElementById("recipeDetail");
const errorMessage = document.getElementById("errorMessage");

// Load recipe when page loads
if (recipeId) {
  loadRecipeDetails(recipeId);
} else {
  showError();
}

async function loadRecipeDetails(id) {
  try {
    // Check if using mock data
    if (SPOONACULAR_API_KEY === "YOUR_API_KEY_HERE") {
      console.log("Using mock data - Please add your Spoonacular API key");
      const mockRecipe = getMockRecipeDetail(id);
      displayRecipeDetails(mockRecipe);
      return;
    }

    // Fetch recipe information from Spoonacular API
    const url = `${SPOONACULAR_BASE_URL}/${id}/information?apiKey=${SPOONACULAR_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch recipe");
    }

    const recipe = await response.json();
    displayRecipeDetails(recipe);
  } catch (error) {
    console.error("Error loading recipe:", error);
    showError();
  }
}

function displayRecipeDetails(recipe) {
  loadingSpinner.style.display = "none";
  recipeDetail.style.display = "block";

  // Set basic info
  document.getElementById("recipeTitle").textContent = recipe.title;
  document.getElementById("recipeImage").src =
    recipe.image || "https://via.placeholder.com/800x400?text=Recipe+Image";
  document.getElementById("readyTime").textContent =
    `${recipe.readyInMinutes || 30} min`;
  document.getElementById("servings").textContent = recipe.servings || 4;

  if (recipe.healthScore) {
    document.getElementById("healthScore").textContent = recipe.healthScore;
  } else {
    document.getElementById("healthScoreContainer").style.display = "none";
  }

  // Display ingredients
  displayIngredients(recipe.extendedIngredients || recipe.ingredients);

  // Display instructions
  displayInstructions(recipe);

  // Load YouTube video
  loadYouTubeVideo(recipe.title);
}

function displayIngredients(ingredients) {
  const ingredientsList = document.getElementById("ingredientsList");
  ingredientsList.innerHTML = "";

  if (!ingredients || ingredients.length === 0) {
    ingredientsList.innerHTML =
      "<li>Ingredients information not available</li>";
    return;
  }

  ingredients.forEach((ingredient) => {
    const li = document.createElement("li");

    // Format ingredient text
    if (ingredient.original) {
      li.textContent = ingredient.original;
    } else if (ingredient.amount && ingredient.unit && ingredient.name) {
      li.textContent = `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`;
    } else {
      li.textContent = ingredient.name || ingredient;
    }

    ingredientsList.appendChild(li);
  });
}

function displayInstructions(recipe) {
  const instructionsList = document.getElementById("instructionsList");
  instructionsList.innerHTML = "";

  // Try to get analyzed instructions first
  if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
    const steps = recipe.analyzedInstructions[0].steps;
    steps.forEach((step) => {
      const stepDiv = createInstructionStep(step.number, step.step);
      instructionsList.appendChild(stepDiv);
    });
  }
  // Fallback to instructions string
  else if (recipe.instructions) {
    const instructions = recipe.instructions
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .split(/\d+\.\s+/) // Split by numbered steps
      .filter((step) => step.trim().length > 0);

    instructions.forEach((instruction, index) => {
      const stepDiv = createInstructionStep(index + 1, instruction.trim());
      instructionsList.appendChild(stepDiv);
    });
  }
  // Use mock instructions if nothing available
  else {
    const mockSteps = [
      "Prepare all ingredients and gather necessary cooking utensils.",
      "Follow standard cooking procedures for this type of dish.",
      "Cook until ingredients are properly done.",
      "Season to taste and serve hot.",
    ];

    mockSteps.forEach((step, index) => {
      const stepDiv = createInstructionStep(index + 1, step);
      instructionsList.appendChild(stepDiv);
    });
  }
}

function createInstructionStep(number, text) {
  const stepDiv = document.createElement("div");
  stepDiv.className = "instruction-step";
  stepDiv.innerHTML = `
        <span class="step-number">${number}</span>
        <span class="step-text">${text}</span>
    `;
  return stepDiv;
}

async function loadYouTubeVideo(recipeName) {
  const videoSection = document.getElementById("videoSection");
  const videoContainer = document.getElementById("videoContainer");

  // Always show a video section with embedded search
  videoSection.style.display = "block";

  try {
    // Check if YouTube API key is set
    if (YOUTUBE_API_KEY === "YOUR_YOUTUBE_API_KEY_HERE") {
      // Provide a direct YouTube search link as fallback
      const searchQuery = encodeURIComponent(`${recipeName} recipe tutorial`);
      videoContainer.innerHTML = `
                <div style="padding: 40px; text-align: center; background: #f8f9fa; border-radius: 12px;">
                    <p style="margin-bottom: 20px; font-size: 1.1rem; color: #555;">
                        🎥 Watch a video tutorial for this recipe
                    </p>
                    <a href="https://www.youtube.com/results?search_query=${searchQuery}" 
                       target="_blank" 
                       style="display: inline-block; padding: 12px 30px; background: #FF0000; color: white; text-decoration: none; border-radius: 25px; font-weight: 600;">
                        Search on YouTube
                    </a>
                    <p style="margin-top: 15px; font-size: 0.9rem; color: #888;">
                        Add YouTube API key in recipe-detail.js for embedded videos
                    </p>
                </div>
            `;
      return;
    }

    const searchQuery = `${recipeName} recipe tutorial`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(searchQuery)}&type=video&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("YouTube API request failed");
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const videoId = data.items[0].id.videoId;
      videoContainer.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}" 
                    allowfullscreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
                </iframe>
            `;
    } else {
      // No video found, provide search link
      const searchQuery = encodeURIComponent(`${recipeName} recipe tutorial`);
      videoContainer.innerHTML = `
                <div style="padding: 40px; text-align: center; background: #f8f9fa; border-radius: 12px;">
                    <p style="margin-bottom: 20px; font-size: 1.1rem; color: #555;">
                        No video found. Search YouTube manually:
                    </p>
                    <a href="https://www.youtube.com/results?search_query=${searchQuery}" 
                       target="_blank" 
                       style="display: inline-block; padding: 12px 30px; background: #FF0000; color: white; text-decoration: none; border-radius: 25px; font-weight: 600;">
                        Search on YouTube
                    </a>
                </div>
            `;
    }
  } catch (error) {
    console.error("Error loading YouTube video:", error);
    // Provide search link on error
    const searchQuery = encodeURIComponent(`${recipeName} recipe tutorial`);
    videoContainer.innerHTML = `
            <div style="padding: 40px; text-align: center; background: #f8f9fa; border-radius: 12px;">
                <p style="margin-bottom: 20px; font-size: 1.1rem; color: #555;">
                    🎥 Watch a video tutorial for this recipe
                </p>
                <a href="https://www.youtube.com/results?search_query=${searchQuery}" 
                   target="_blank" 
                   style="display: inline-block; padding: 12px 30px; background: #FF0000; color: white; text-decoration: none; border-radius: 25px; font-weight: 600;">
                    Search on YouTube
                </a>
            </div>
        `;
  }
}

function showError() {
  loadingSpinner.style.display = "none";
  errorMessage.style.display = "block";
}

// Mock recipe data for demonstration
// Mock recipe data for demonstration – expanded to match script.js IDs
function getMockRecipeDetail(id) {
  const mockRecipes = {
    // Make sure keys match the IDs you have in script.js recipeDatabase
    1: {
      title: "Classic Tomato Pasta",
      image:
        "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
      readyInMinutes: 25,
      servings: 4,
      healthScore: 72,
      extendedIngredients: [
        { original: "300g pasta" },
        { original: "4–5 ripe tomatoes, chopped" },
        { original: "4 cloves garlic, minced" },
        { original: "1 onion, finely chopped" },
        { original: "3 tbsp olive oil" },
        { original: "Salt, pepper, fresh basil to taste" },
      ],
      instructions:
        "1. Boil pasta in salted water.\n2. Sauté garlic and onion in olive oil.\n3. Add tomatoes, cook down to sauce (10 min).\n4. Season and toss with drained pasta.\n5. Garnish with basil.",
    },
    2: {
      title: "Chicken Stir Fry",
      image:
        "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800",
      readyInMinutes: 20,
      servings: 3,
      healthScore: 85,
      extendedIngredients: [
        { original: "400g chicken breast, sliced" },
        { original: "2 bell peppers" },
        { original: "1 large onion" },
        { original: "3 garlic cloves" },
        { original: "3 tbsp soy sauce" },
        { original: "2 tbsp oil" },
      ],
      instructions:
        "1. Marinate chicken briefly.\n2. Stir-fry chicken in hot oil.\n3. Add vegetables and garlic.\n4. Finish with soy sauce.\n5. Serve hot.",
    },
    88: {
      title: "Cheesy Baked Potatoes",
      image: "https://images.unsplash.com/photo-1559058922-4c2c6c1e3f5f?w=800",
      readyInMinutes: 50,
      servings: 4,
      healthScore: 68,
      extendedIngredients: [
        { original: "4 large potatoes" },
        { original: "100g cheese, grated" },
        { original: "50g butter" },
        { original: "100ml cream" },
        { original: "Salt, pepper" },
      ],
      instructions:
        "1. Bake potatoes at 200°C for 40 min.\n2. Cut open, mash inside lightly.\n3. Add butter, cream, cheese.\n4. Bake another 10 min until golden.",
    },
    94: {
      title: "Grilled Salmon",
      image:
        "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
      readyInMinutes: 15,
      servings: 2,
      healthScore: 92,
      extendedIngredients: [
        { original: "2 salmon fillets" },
        { original: "2 tbsp olive oil" },
        { original: "3 garlic cloves, minced" },
        { original: "Salt, pepper, lemon" },
      ],
      instructions:
        "1. Rub salmon with oil, garlic, salt & pepper.\n2. Grill/pan-sear 4–5 min per side.\n3. Squeeze lemon over top.",
    },
    101: {
      title: "Egg Bhurji (Indian Scrambled Eggs)",
      image:
        "https://images.unsplash.com/photo-1596817468060-de7b8c44a0ac?w=800",
      readyInMinutes: 10,
      servings: 2,
      healthScore: 75,
      extendedIngredients: [
        { original: "4 eggs" },
        { original: "1 onion, chopped" },
        { original: "1 tomato, chopped" },
        { original: "2 green chilies (optional)" },
        { original: "1/2 tsp turmeric, chili powder" },
        { original: "2 tbsp oil, salt" },
      ],
      instructions:
        "1. Heat oil, sauté onion & tomato.\n2. Add spices.\n3. Beat eggs, pour in, scramble well.\n4. Serve with bread/roti.",
    },
    102: {
      title: "Aloo Sabzi (Simple Potato Curry)",
      image:
        "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800",
      readyInMinutes: 25,
      servings: 4,
      healthScore: 70,
      extendedIngredients: [
        { original: "4 medium potatoes" },
        { original: "1 onion, 1 tomato" },
        { original: "Ginger-garlic paste" },
        { original: "1 tsp each: turmeric, cumin, chili powder" },
        { original: "2 tbsp oil, salt" },
      ],
      instructions:
        "1. Boil & cube potatoes.\n2. Sauté onion, ginger-garlic, tomato & spices.\n3. Add potatoes, cook 10 min with little water.\n4. Garnish with coriander.",
    },
    104: {
      title: "Garlic Bread",
      image:
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
      readyInMinutes: 15,
      servings: 4,
      healthScore: 55,
      extendedIngredients: [
        { original: "1 baguette or bread loaf" },
        { original: "4–5 garlic cloves, minced" },
        { original: "100g butter" },
        { original: "2 tbsp chopped parsley (optional)" },
        { original: "50g cheese (optional)" },
      ],
      instructions:
        "1. Mix softened butter with minced garlic & parsley.\n2. Slice bread, spread generously.\n3. Optional: top with cheese.\n4. Bake at 200°C for 8–10 min until golden.",
    },
    // Add more entries here matching EVERY ID you have in script.js → recipeDatabase
    // If ID not found → fallback
  };

  return (
    mockRecipes[id] || {
      title: "Recipe Not Found in Mock Data",
      image:
        "https://via.placeholder.com/800x400?text=Add+This+Recipe+to+mockRecipes",
      readyInMinutes: 30,
      servings: 2,
      extendedIngredients: [{ original: "Please add mock data for ID " + id }],
      instructions:
        "This is a placeholder because mock data for this ID is missing in recipe-detail.js",
    }
  );
}
