// PantryPal - Recipe Finder (Updated: Partial matching + better UX)

// === CONFIG ===
const SPOONACULAR_API_KEY = "YOUR_API_KEY_HERE"; // Replace when you have real key
const SPOONACULAR_BASE_URL = "https://api.spoonacular.com/recipes";
const STORAGE_KEY = "pantrypal_selected_ingredients";

// === DOM Elements ===
const findRecipesBtn = document.getElementById("findRecipesBtn");
const clearBtn = document.getElementById("clearBtn");
const selectedDiv = document.getElementById("selectedIngredients");
const recipesSection = document.getElementById("recipesSection");
const recipeResults = document.getElementById("recipeResults");
const loadingSpinner = document.getElementById("loadingSpinner");
const noResults = document.getElementById("noResults");

// === Event Listeners ===
findRecipesBtn.addEventListener("click", findRecipes);
clearBtn.addEventListener("click", clearAllSelections);

document.querySelectorAll('input[name="ingredient"]').forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    updateSelectedDisplay();
    saveSelections();
  });
});

// === Persistence ===
function saveSelections() {
  const selected = getSelectedIngredients();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
}

function loadSelections() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  const values = JSON.parse(saved);
  document.querySelectorAll('input[name="ingredient"]').forEach((checkbox) => {
    checkbox.checked = values.includes(checkbox.value);
  });

  updateSelectedDisplay();

  if (values.length > 0) {
    setTimeout(findRecipes, 200);
  }
}

function clearAllSelections() {
  document
    .querySelectorAll('input[name="ingredient"]')
    .forEach((cb) => (cb.checked = false));
  localStorage.removeItem(STORAGE_KEY);
  updateSelectedDisplay();
  recipesSection.style.display = "none";
  recipeResults.innerHTML = "";
  noResults.style.display = "none";
}

// === Core ===
function getSelectedIngredients() {
  return Array.from(
    document.querySelectorAll('input[name="ingredient"]:checked'),
  ).map((cb) => cb.value);
}

function updateSelectedDisplay() {
  const selected = getSelectedIngredients();
  selectedDiv.innerHTML =
    selected.length > 0
      ? `<strong>Selected:</strong> ${selected.join(", ")} <span style="color:#667eea">(${selected.length})</span>`
      : "";
}

async function findRecipes() {
  const ingredients = getSelectedIngredients();
  if (ingredients.length === 0) {
    alert("Please select at least one ingredient!");
    return;
  }

  recipesSection.style.display = "block";
  loadingSpinner.style.display = "block";
  recipeResults.innerHTML = "";
  noResults.style.display = "none";

  recipesSection.scrollIntoView({ behavior: "smooth" });

  try {
    if (SPOONACULAR_API_KEY === "YOUR_API_KEY_HERE") {
      console.log("Using mock data (partial matching enabled)");
      const mockData = getMockRecipes(ingredients);
      displayRecipes(mockData);
      return;
    }

    // Real API (when you get key)
    const query = ingredients.join(",+");
    const url = `${SPOONACULAR_BASE_URL}/findByIngredients?ingredients=${query}&number=50&ranking=2&ignorePantry=true&apiKey=${SPOONACULAR_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("API failed");

    const recipes = await res.json();
    const goodMatches = recipes.filter(
      (r) => (r.missedIngredientCount || 0) <= 4,
    );
    displayRecipes(goodMatches);
  } catch (err) {
    console.error(err);
    loadingSpinner.style.display = "none";
    noResults.style.display = "block";
    noResults.innerHTML =
      "<p>Error loading recipes. Using mock mode instead.</p>";
    displayRecipes(getMockRecipes(ingredients));
  }
}

function displayRecipes(recipes) {
  loadingSpinner.style.display = "none";

  if (!recipes || recipes.length === 0) {
    noResults.style.display = "block";
    noResults.innerHTML =
      "<p>No good matches found. Try adding more common ingredients (onion, tomato, oil, garlic, salt...)</p>";
    return;
  }

  recipeResults.innerHTML = "";
  recipes.forEach((r) => recipeResults.appendChild(createRecipeCard(r)));
}

function createRecipeCard(recipe) {
  const card = document.createElement("div");
  card.className = "recipe-card";

  const used = recipe.usedIngredientCount || 0;
  const miss = recipe.missedIngredientCount || 0;
  const match =
    recipe.matchPercentage || Math.round((used / (used + miss)) * 100) || 0;

  const matchColor =
    match >= 80 ? "#51cf66" : match >= 60 ? "#ffa500" : "#ff6b6b";

  card.innerHTML = `
        <img src="${recipe.image || "https://via.placeholder.com/300x200?text=No+Image"}"
             alt="${recipe.title}"
             class="recipe-image"
             onerror="this.src='https://via.placeholder.com/300x200/667eea/ffffff?text=Recipe'">
        <div class="recipe-content">
            <h3 class="recipe-title">${recipe.title}</h3>
            <div class="recipe-meta" style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
                <span class="used-ingredients">✓ ${used} matched</span>
                <span style="color:${matchColor}; font-weight:600;">
                    ${match}% match ${miss > 0 ? `(${miss} missing)` : "✓ Perfect!"}
                </span>
            </div>
        </div>
    `;

  card.addEventListener("click", () => {
    window.location.href = `recipe-detail.html?id=${recipe.id}`;
  });

  return card;
}

// === IMPROVED MOCK MATCHING – partial & scored ===
function getMockRecipes(selectedIngredients) {
  const selectedSet = new Set(
    selectedIngredients.map((i) => i.toLowerCase().trim()),
  );

  // Your original mock recipes (paste ALL of them here – I'm showing expanded + new ones)
  const recipeDatabase = [
    {
      id: 1,
      title: "Classic Tomato Pasta",
      image:
        "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
      required: [
        "tomato",
        "pasta",
        "garlic",
        "olive oil",
        "onion",
        "salt",
        "pepper",
      ],
    },
    {
      id: 2,
      title: "Chicken Stir Fry",
      image:
        "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400",
      required: [
        "chicken",
        "bell pepper",
        "onion",
        "garlic",
        "soy sauce",
        "olive oil",
      ],
    },
    {
      id: 88,
      title: "Cheesy Baked Potatoes",
      image: "https://images.unsplash.com/photo-1559058922-4c2c6c1e3f5f?w=400",
      required: ["potato", "cheese", "butter", "cream", "salt", "pepper"],
    },
    {
      id: 94,
      title: "Grilled Salmon",
      image:
        "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400",
      required: ["fish", "olive oil", "garlic", "salt", "pepper"],
    },
    {
      id: 101,
      title: "Egg Bhurji (Indian Scrambled Eggs)",
      image:
        "https://images.unsplash.com/photo-1596817468060-de7b8c44a0ac?w=400",
      required: [
        "eggs",
        "onion",
        "tomato",
        "garlic",
        "turmeric",
        "chili powder",
        "oil",
        "salt",
      ],
    },
    {
      id: 102,
      title: "Aloo Sabzi (Simple Potato Curry)",
      image:
        "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400",
      required: [
        "potato",
        "onion",
        "tomato",
        "garlic",
        "ginger",
        "turmeric",
        "cumin",
        "chili powder",
        "oil",
        "salt",
      ],
    },
    {
      id: 103,
      title: "Tomato Rice",
      image:
        "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400",
      required: [
        "rice",
        "tomato",
        "onion",
        "garlic",
        "ginger",
        "turmeric",
        "cumin",
        "oil",
        "salt",
      ],
    },
    {
      id: 104,
      title: "Garlic Bread",
      image:
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
      required: ["bread", "garlic", "butter", "cheese"],
    },
    // ... add your other ~90 recipes here ...
    // The more recipes you have, the better partial matching works
  ];

  const scored = recipeDatabase.map((r) => {
    let matched = 0;
    r.required.forEach((ing) => {
      if (selectedSet.has(ing.toLowerCase())) matched++;
    });
    const total = r.required.length;
    const missing = total - matched;
    const percentage = Math.round((matched / total) * 100);

    return {
      ...r,
      usedIngredientCount: matched,
      missedIngredientCount: missing,
      matchPercentage: percentage,
    };
  });

  // Show recipes with at least ~40–50% match or max 5 missing
  return scored
    .filter((r) => r.matchPercentage >= 45 || r.missedIngredientCount <= 5)
    .sort(
      (a, b) =>
        b.matchPercentage - a.matchPercentage ||
        a.missedIngredientCount - b.missedIngredientCount,
    );
}

// === INIT ===
updateSelectedDisplay();
loadSelections();
