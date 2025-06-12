import '@/styles/page.css';
import '@/styles/player-info.css';
import '@/styles/filters.css';
import '@/styles/table.css';
import '@/styles/video.css';

export default {
  name: "GameActionsByDate",
  data() {
    return {
      games: [],
      selectedDate: null,
      selectedAction: null,
      filterExpanded: false,
      
      // Sorting data
      sortColumn: null,
      sortDirection: 'asc',
      
      // Filter data
      batterSearch: "",
      selectedBatter: "",
      showBatterDropdown: false,
      
      pitcherSearch: "",
      selectedPitcher: "",
      showPitcherDropdown: false,
      
      // Multi-select outcomes
      selectedOutcomes: [],
      showOutcomeDropdown: false,
      
      // Numeric filters
      numericFilters: {
        EXIT_SPEED: { operator: "", value: null, min: null, max: null },
        LAUNCH_ANGLE: { operator: "", value: null, min: null, max: null },
        EXIT_DIRECTION: { operator: "", value: null, min: null, max: null },
        HIT_DISTANCE: { operator: "", value: null, min: null, max: null },
        HANG_TIME: { operator: "", value: null, min: null, max: null },
        HIT_SPIN_RATE: { operator: "", value: null, min: null, max: null },
      },
      
      numericFilterKeys: ['EXIT_SPEED', 'LAUNCH_ANGLE', 'EXIT_DIRECTION', 'HIT_DISTANCE', 'HANG_TIME', 'HIT_SPIN_RATE'],
      
      scrollableColumns: [
        "PITCHER",
        "PLAY_OUTCOME",
        "EXIT_SPEED",
        "LAUNCH_ANGLE",
        "EXIT_DIRECTION",
        "HIT_DISTANCE",
        "HANG_TIME",
        "HIT_SPIN_RATE",
      ],
    };
  },
  computed: {
    selectedGame() {
      return this.games.find((game) => game.game_date === this.selectedDate);
    },
    
    filteredBatters() {
      if (!this.selectedGame?.actions) return [];
      const allBatters = this.uniqueValues('BATTER');
      return allBatters.filter(batter => 
        batter.toLowerCase().includes(this.batterSearch.toLowerCase())
      );
    },
    
    filteredPitchers() {
      if (!this.selectedGame?.actions) return [];
      const allPitchers = this.uniqueValues('PITCHER');
      return allPitchers.filter(pitcher => 
        pitcher.toLowerCase().includes(this.pitcherSearch.toLowerCase())
      );
    },
    
    hasActiveFilters() {
      return (
        this.selectedBatter ||
        this.selectedPitcher ||
        this.selectedOutcomes.length > 0 ||
        Object.values(this.numericFilters).some(filter => 
          filter.operator && (filter.value !== null || (filter.min !== null && filter.max !== null))
        )
      );
    },
    
    activeNumericFilters() {
      return Object.fromEntries(
        Object.entries(this.numericFilters).filter(([, filter]) => 
          filter.operator && (filter.value !== null || (filter.min !== null && filter.max !== null))
        )
      );
    },
    
    filteredActions() {
      if (!this.selectedGame?.actions) return [];
      
      return this.selectedGame.actions.filter((action) => {
        if (this.selectedBatter && action.BATTER !== this.selectedBatter) return false;
        if (this.selectedPitcher && action.PITCHER !== this.selectedPitcher) return false;
        if (this.selectedOutcomes.length > 0 && !this.selectedOutcomes.includes(action.PLAY_OUTCOME)) return false;
        
        for (const key in this.numericFilters) {
          const { operator, value, min, max } = this.numericFilters[key];
          const actual = parseFloat(action[key]);
          
          if (operator && !isNaN(actual)) {
            if (operator === ">" && !(actual > value)) return false;
            if (operator === "<" && !(actual < value)) return false;
            if (operator === "=" && !(actual === value)) return false;
            if (operator === "between" && (isNaN(min) || isNaN(max) || actual < min || actual > max)) return false;
          }
        }
        
        return true;
      });
    },

    sortedActions() {
      if (!this.sortColumn) {
        return this.filteredActions;
      }

      const sorted = [...this.filteredActions].sort((a, b) => {
        let aVal = a[this.sortColumn];
        let bVal = b[this.sortColumn];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const numericColumns = ['EXIT_SPEED', 'LAUNCH_ANGLE', 'EXIT_DIRECTION', 'HIT_DISTANCE', 'HANG_TIME', 'HIT_SPIN_RATE'];
        if (numericColumns.includes(this.sortColumn)) {
          aVal = parseFloat(aVal);
          bVal = parseFloat(bVal);
          
          if (isNaN(aVal) && isNaN(bVal)) return 0;
          if (isNaN(aVal)) return 1;
          if (isNaN(bVal)) return -1;
          
          return aVal - bVal;
        }

        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
        return 0;
      });

      return this.sortDirection === 'desc' ? sorted.reverse() : sorted;
    },

    selectedPlayerStats() {
      if (!this.selectedAction || !this.selectedGame?.actions) return null;
    
      const batterName = this.selectedAction.BATTER;
      const batterPlays = this.selectedGame.actions.filter(
        (a) => a.BATTER === batterName
      );
    
      if (batterPlays.length === 0) return null;
    
      const avg = (key) => {
        const validValues = batterPlays.map(a => parseFloat(a[key])).filter(v => !isNaN(v));
        const sum = validValues.reduce((acc, val) => acc + val, 0);
        return validValues.length ? sum / validValues.length : null;
      };
    
      return {
        name: batterName,
        headshot: null, // placeholder
        avgExitSpeed: avg('EXIT_SPEED'),
        avgExitDirection: avg('EXIT_DIRECTION'),
        avgLaunchAngle: avg('LAUNCH_ANGLE'),
        avgHitDistance: avg('HIT_DISTANCE'),
        avgPitchSpeed: avg('PITCH_SPEED'),
        avgSpinRate: avg('HIT_SPIN_RATE'),
        avgHangTime: avg('HANG_TIME'),
      };
    }
  },
  methods: {

    formatOutcome(outcome) {
      if (outcome === 'HomeRun') return 'Home Run';
      return outcome;
    },
    
    setSortColumn(column) {
      if (this.sortColumn === column) {
        // Toggle direction if same column
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        // Set new column and default to ascending
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }
    },

    getSortClass(column) {
      return {
        'sort-active': this.sortColumn === column
      };
    },

    selectAction(action) {
      this.selectedAction = this.selectedAction === action ? null : action;
    },
    
    uniqueValues(key) {
      if (!this.selectedGame?.actions) return [];
      const values = new Set();
      for (const action of this.selectedGame.actions) {
        if (action[key]) values.add(action[key]);
      }
      return [...values].sort();
    },
    
    toggleFilterExpansion() {
      this.filterExpanded = !this.filterExpanded;
    },
    
    clearAllFilters() {
      this.selectedBatter = "";
      this.batterSearch = "";
      this.selectedPitcher = "";
      this.pitcherSearch = "";
      this.selectedOutcomes = [];
      
      // Reset sorting
      this.sortColumn = null;
      this.sortDirection = 'asc';
      
      for (const key in this.numericFilters) {
        this.numericFilters[key] = { operator: "", value: null, min: null, max: null };
      }
    },
    
    selectBatter(batter) {
      this.selectedBatter = batter;
      this.batterSearch = batter;
      this.showBatterDropdown = false;
    },
    
    hideBatterDropdown() {
      setTimeout(() => {
        this.showBatterDropdown = false;
      }, 200);
    },
    
    selectPitcher(pitcher) {
      this.selectedPitcher = pitcher;
      this.pitcherSearch = pitcher;
      this.showPitcherDropdown = false;
    },
    
    hidePitcherDropdown() {
      setTimeout(() => {
        this.showPitcherDropdown = false;
      }, 200);
    },
    
    toggleOutcomeDropdown() {
      this.showOutcomeDropdown = !this.showOutcomeDropdown;
    },
    
    clearBatterFilter() {
      this.selectedBatter = "";
      this.batterSearch = "";
    },
    
    clearPitcherFilter() {
      this.selectedPitcher = "";
      this.pitcherSearch = "";
    },
    
    clearOutcomeFilter() {
      this.selectedOutcomes = [];
    },
    
    clearNumericFilter(key) {
      this.numericFilters[key] = { operator: "", value: null, min: null, max: null };
    },
    
    formatLabel(key) {
      return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    },
    
    getPlaceholder(key) {
      const placeholders = {
        EXIT_SPEED: 'mph',
        LAUNCH_ANGLE: 'degrees',
        EXIT_DIRECTION: 'degrees',
        HIT_DISTANCE: 'feet',
        HANG_TIME: 'seconds',
        HIT_SPIN_RATE: 'rpm'
      };
      return placeholders[key] || '';
    },
    
    formatNumericFilter(filter) {
      if (filter.operator === 'between') {
        return `${filter.min} - ${filter.max}`;
      } else {
        return `${filter.operator} ${filter.value}`;
      }
    }
  },
  watch: {
    selectedDate() {
      this.clearAllFilters();
      this.selectedAction = null;
      if (this.selectedGame?.actions?.length > 0) {
        this.selectedAction = this.selectedGame.actions[0];
      }
    }
  },
  mounted() {
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => {
        this.games = data;
        if (data.length > 0) {
          this.selectedDate = data[0].game_date;
          this.selectedAction = data[0].actions[0];
        }
      })
      .catch((err) => console.error("Error fetching games:", err));
      
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.multi-select')) {
        this.showOutcomeDropdown = false;
      }
    });
  },
};