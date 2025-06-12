import '@/styles/page.css';
import '@/styles/player-info.css';
import '@/styles/filters.css';
import '@/styles/table.css';
import '@/styles/video.css';

export default {
  name: "PitchersPage",

  props: {
    selectedPlayerId: {
      type: [String, Number],
      default: null
    }
  },

  data() {
    return {
      pitchers: {},
      selectedPitcherId: null,
      selectedPlay: null,
      searchQuery: "",
      filterExpanded: false,
      hasSelectedInitialPlay: false,

      sortColumn: null,
      sortDirection: 'asc',

      filters: {
        dateFrom: "",
        dateTo: "",
      },

      batterSearch: "",
      selectedBatter: "",
      showBatterDropdown: false,

      selectedOutcomes: [],
      showOutcomeDropdown: false,

      // Numeric filters with enhanced options
      numericFilters: {
        EXIT_SPEED: { operator: "", value: null, min: null, max: null },
        LAUNCH_ANGLE: { operator: "", value: null, min: null, max: null },
        HIT_DISTANCE: { operator: "", value: null, min: null, max: null },
        HIT_SPIN_RATE: { operator: "", value: null, min: null, max: null },
      },

      numericFilterKeys: ['EXIT_SPEED', 'LAUNCH_ANGLE', 'HIT_DISTANCE', 'HIT_SPIN_RATE'],

    };
  },

  computed: {
    selectedPitcherPlays() {
      return this.pitchers?.[this.selectedPitcherId] || [];
    },

    filteredPitchers() {
      const query = this.searchQuery.toLowerCase();
      return Object.fromEntries(
        Object.entries(this.pitchers).filter(([, plays]) =>
          this.getPitcherName(plays).toLowerCase().includes(query)
        )
      );
    },

    filteredBatters() {
      const allBatters = this.uniqueValues('BATTER');
      return allBatters.filter(batter =>
        batter.toLowerCase().includes(this.batterSearch.toLowerCase())
      );
    },

    hasActiveFilters() {
      return (
        this.filters.dateFrom ||
        this.filters.dateTo ||
        this.selectedBatter ||
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

    filteredPlays() {
      return this.selectedPitcherPlays.filter((play) => {
        if (!play) return false;

        if (this.filters.dateFrom && play.GAME_DATE < this.filters.dateFrom) return false;
        if (this.filters.dateTo && play.GAME_DATE > this.filters.dateTo) return false;

        if (this.selectedBatter && play.BATTER !== this.selectedBatter) return false;

        if (this.selectedOutcomes.length > 0 && !this.selectedOutcomes.includes(play.PLAY_OUTCOME)) return false;

        for (const key in this.numericFilters) {
          const { operator, value, min, max } = this.numericFilters[key];
          const actual = parseFloat(play[key]);

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

    sortedPlays() {
      if (!this.sortColumn) return this.filteredPlays;
    
      const sorted = [...this.filteredPlays].sort((a, b) => {
        let aVal = a[this.sortColumn];
        let bVal = b[this.sortColumn];
    
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
    
        const numericColumns = ['EXIT_SPEED', 'LAUNCH_ANGLE', 'HIT_DISTANCE', 'HIT_SPIN_RATE'];
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
    }
  },

  methods: {

    formatOutcome(outcome) {
      if (outcome === 'HomeRun') return 'Home Run';
      return outcome;
    },

    setSortColumn(column) {
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }
    },
    
    getSortClass(column) {
      return {
        'sort-active': this.sortColumn === column
      };
    },

    getPitcherName(plays) {
      return plays?.length > 0 ? plays[0].PITCHER : "Unknown";
    },

    getAvg(plays, key) {
      const valid = plays.map((p) => parseFloat(p[key])).filter((n) => !isNaN(n));
      if (!valid.length) return "N/A";
      const avg = valid.reduce((sum, val) => sum + val, 0) / valid.length;
      return `${avg.toFixed(1)} `;
    },

    uniqueValues(key) {
      const values = new Set();
      for (const play of this.selectedPitcherPlays) {
        if (play[key]) values.add(play[key]);
      }
      return [...values].sort();
    },

    selectPitcher(pitcherId) {
      this.selectedPitcherId = pitcherId;
      this.selectedPlay = null;
      this.clearAllFilters();
    },

    selectPlay(play) {
      this.selectedPlay = this.selectedPlay === play ? null : play;
    },

    toggleFilterExpansion() {
      this.filterExpanded = !this.filterExpanded;
    },

    clearAllFilters() {
      this.filters.dateFrom = "";
      this.filters.dateTo = "";
      this.selectedBatter = "";
      this.batterSearch = "";
      this.selectedOutcomes = [];

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

    toggleOutcomeDropdown() {
      this.showOutcomeDropdown = !this.showOutcomeDropdown;
    },

    applyPreset(preset) {
      this.clearAllFilters();

      switch (preset) {
        case 'hardHit':
          this.numericFilters.EXIT_SPEED = { operator: ">=", value: 95, min: null, max: null };
          break;
        case 'linedrives':
          this.numericFilters.LAUNCH_ANGLE = { operator: "between", value: null, min: 10, max: 25 };
          break;
        case 'flyBalls':
          this.numericFilters.LAUNCH_ANGLE = { operator: ">=", value: 25, min: null, max: null };
          break;
        case 'longDistance':
          this.numericFilters.HIT_DISTANCE = { operator: ">=", value: 300, min: null, max: null };
          break;
      }
    },

    clearDateFilter() {
      this.filters.dateFrom = "";
      this.filters.dateTo = "";
    },

    clearBatterFilter() {
      this.selectedBatter = "";
      this.batterSearch = "";
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
        HIT_DISTANCE: 'feet'
      };
      return placeholders[key] || '';
    },

    formatDateRange() {
      if (this.filters.dateFrom && this.filters.dateTo) {
        return `${this.filters.dateFrom} to ${this.filters.dateTo}`;
      } else if (this.filters.dateFrom) {
        return `from ${this.filters.dateFrom}`;
      } else if (this.filters.dateTo) {
        return `until ${this.filters.dateTo}`;
      }
      return '';
    },

    formatNumericFilter(filter) {
      if (filter.operator === 'between') {
        return `${filter.min} - ${filter.max}`;
      } else {
        return `${filter.operator} ${filter.value}`;
      }
    },

    findPitcherById(id) {
      const targetId = id?.toString();
      return Object.keys(this.pitchers).find(key => {
        const plays = this.pitchers[key];
        return plays.length > 0 && plays[0].PITCHER_ID?.toString() === targetId;
      });
    },

    handleInitialSelection() {
      const hasData = Object.keys(this.pitchers).length > 0;
  
      if (this.selectedPlayerId && hasData) {
        const pitcherId = this.findPitcherById(this.selectedPlayerId);
        if (pitcherId) this.selectedPitcherId = pitcherId;
      } else if (!this.selectedPitcherId && hasData) {
        this.selectedPitcherId = Object.keys(this.pitchers)[0];
      }
  
      this.$nextTick(() => {
        const firstPlay = this.filteredPlays?.[0];
        if (firstPlay) {
          this.selectedPlay = firstPlay;
          this.hasSelectedInitialPlay = true;
        }
      });
    }
  },

  watch: {
    selectedPitcherId() {
      this.selectedPlay = null;
    },
    filteredPlays(newVal) {
      this.selectedPlay = newVal?.[0] || null;
      this.hasSelectedInitialPlay = !!newVal?.length;
    },
    selectedPlayerId(newVal) {
      const pitcherId = this.findPitcherById(newVal);
      if (pitcherId && pitcherId !== this.selectedPitcherId) {
        this.selectedPitcherId = pitcherId;
        this.clearAllFilters();
      }
    },
    pitchers() {
      this.handleInitialSelection();
    }
  },
  
  mounted() {
    fetch("/api/pitchers")
      .then((res) => res.json())
      .then((data) => {
        this.pitchers = data;
      })
      .catch((err) => console.error("Error loading pitcher data:", err));
  
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".multi-select")) {
        this.showOutcomeDropdown = false;
      }
    });
  }
}