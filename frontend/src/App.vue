<template>
  <div id="app">
    <!-- Header with Navigation and Search -->
    <header class="app-header">
      <!-- Navigation -->
      <nav class="navbar">
        <button :class="{ active: currentPage === 'game' }" @click="navigateToPage('game')">Game Select</button>
        <button :class="{ active: currentPage === 'batters' }" @click="navigateToPage('batters')">Batters</button>
        <button :class="{ active: currentPage === 'pitchers' }" @click="navigateToPage('pitchers')">Pitchers</button>
      </nav>

      <!-- Global Search -->
      <div class="global-search-bar">
        <div class="search-input-container">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search all players..."
            @focus="showSearchDropdown = true"
            @blur="hideSearchDropdown"
            @input="onSearchInput"
          />
          <div class="search-icon">🔍</div>
          <button
            v-if="searchQuery"
            class="clear-search"
            @click="clearSearch"
            type="button"
          >
            ✕
          </button>
        </div>

        <div v-if="showSearchDropdown && filteredResults.length" class="search-dropdown">
          <div class="search-header">
            {{ filteredResults.length }} result{{ filteredResults.length !== 1 ? 's' : '' }} found
          </div>
          <div
            v-for="player in limitedResults"
            :key="player.id + '_' + player.type"
            class="search-result"
            @mousedown="goToPlayer(player)"
          >
            <div class="player-info">
              <span class="player-name">{{ player.name }}</span>
              <span class="type-tag" :class="player.type">{{ player.type }}</span>
            </div>
            <div class="player-id">#{{ player.id }}</div>
          </div>
          <div v-if="filteredResults.length > maxResults" class="search-footer">
            Showing {{ maxResults }} of {{ filteredResults.length }} results
          </div>
        </div>

        <div v-if="showSearchDropdown && searchQuery && !filteredResults.length" class="search-dropdown">
          <div class="no-results">No players found matching "{{ searchQuery }}"</div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="app-container">
      <GameActionsByDate v-if="currentPage === 'game'" />
      <BattersPage v-else-if="currentPage === 'batters'" :selectedPlayerId="selectedPlayerId" />
      <PitchersPage v-else :selectedPlayerId="selectedPlayerId" />
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import GameActionsByDate from "./components/GameActionsByDate.vue";
import BattersPage from "./components/BattersPage.vue";
import PitchersPage from "./components/PitchersPage.vue";

export default {
  name: "App",
  components: {
    GameActionsByDate,
    BattersPage,
    PitchersPage,
  },
  data() {
    return {
      currentPage: "game",
      searchQuery: "",
      showSearchDropdown: false,
      allPlayers: [],
      selectedPlayerId: null,
      maxResults: 10,
    };
  },
  computed: {
    filteredResults() {
      if (!this.searchQuery.trim()) return [];

      const q = this.searchQuery.toLowerCase().trim();
      return this.allPlayers
        .filter((p) => p.name.toLowerCase().includes(q) || p.id.toString().includes(q))
        .sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const aStartsWith = aName.startsWith(q);
          const bStartsWith = bName.startsWith(q);

          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;

          return aName.localeCompare(bName);
        });
    },
    limitedResults() {
      return this.filteredResults.slice(0, this.maxResults);
    },
  },
  methods: {
    async fetchAllPlayers() {
      try {
        const [battersRes, pitchersRes] = await Promise.all([
          axios.get("/api/batters"),
          axios.get("/api/pitchers"),
        ]);

        const batters = Object.values(battersRes.data)
          .map(actions => actions[0])
          .filter(Boolean)
          .map(p => ({
            id: p.BATTER_ID,
            name: p.BATTER,
            type: "batter"
          }));

        const pitchers = Object.values(pitchersRes.data)
          .map(actions => actions[0])
          .filter(Boolean)
          .map(p => ({
            id: p.PITCHER_ID,
            name: p.PITCHER,
            type: "pitcher"
          }));

        const allPlayersMap = new Map();
        [...batters, ...pitchers].forEach(player => {
          const key = `${player.id}_${player.type}`;
          if (!allPlayersMap.has(key)) {
            allPlayersMap.set(key, player);
          }
        });

        this.allPlayers = Array.from(allPlayersMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    },
    goToPlayer(player) {
      this.currentPage = player.type === "batter" ? "batters" : "pitchers";
      this.selectedPlayerId = player.id;
      this.clearSearch();
    },
    navigateToPage(page) {
      this.currentPage = page;
      // Clear selected player when manually navigating (not from search)
      this.selectedPlayerId = null;
    },
    clearSearch() {
      this.searchQuery = "";
      this.showSearchDropdown = false;
    },
    onSearchInput() {
      this.showSearchDropdown = this.searchQuery.trim().length > 0;
    },
    hideSearchDropdown() {
      setTimeout(() => {
        this.showSearchDropdown = false;
      }, 200);
    },
  },
  mounted() {
    this.fetchAllPlayers();
  },
};
</script>

<style>
/* App Container */
.app-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* Header */
.app-header {
  background-color: #ffffff;
  border-bottom: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  top: 0;
  z-index: 100;
}

/* Navigation Bar */
.navbar {
  display: flex;
  justify-content: center;
  padding: 1rem 0 0.5rem;
  gap: 2rem;
}

.navbar button {
  background: none;
  border: none;
  font-size: 1.1rem;
  font-weight: 600;
  color: #555;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  border-radius: 4px 4px 0 0;
}

.navbar button:hover {
  background-color: #f8f9fa;
}

.navbar button.active {
  color: maroon;
  border-color: maroon;
  background-color: #fff5f5;
}

/* Global Search */
.global-search-bar {
  max-width: 500px;
  margin: 0 auto;
  position: relative;
  padding: 1rem 1.5rem 1.5rem;
}

.search-input-container {
  position: relative;
}

.global-search-bar input {
  width: 100%;
  padding: 0.8rem 2.5rem 0.8rem 2.5rem;
  font-size: 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.global-search-bar input:focus {
  outline: none;
  border-color: maroon;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(128, 0, 0, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  pointer-events: none;
}

.clear-search {
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.2rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-search:hover {
  background-color: #f8f9fa;
  color: #495057;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 320px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #dee2e6;
  border-top: none;
  z-index: 1000;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.search-header {
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  font-size: 0.85rem;
  color: #6c757d;
  border-bottom: 1px solid #dee2e6;
  font-weight: 500;
}

.search-result {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-result:hover {
  background-color: #f8f9fa;
}

.search-result:last-child {
  border-bottom: none;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.player-name {
  font-weight: 500;
  color: #333;
}

.player-id {
  font-size: 0.85rem;
  color: #6c757d;
}

.type-tag {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  text-transform: uppercase;
}

.type-tag.batter {
  background-color: #e3f2fd;
  color: #1976d2;
}

.type-tag.pitcher {
  background-color: #fff3e0;
  color: #f57c00;
}

.search-footer {
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  font-size: 0.85rem;
  color: #6c757d;
  text-align: center;
  border-top: 1px solid #dee2e6;
}

.no-results {
  padding: 1rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

/* Responsive Design */
@media (max-width: 768px) {
  .navbar {
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .navbar button {
    font-size: 1rem;
    padding: 0.4rem 0.8rem;
  }
  
  .global-search-bar {
    padding: 1rem;
    max-width: none;
  }
  
  .app-container {
    padding: 1rem;
  }
}
</style>