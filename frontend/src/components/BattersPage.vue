<template>
  <div class="shared-page">
    <h2>Batter Outcomes</h2>

    <!-- Player Header with Name and Averages -->
    <div v-if="selectedBatterPlays.length" class="player-header">
      <div class="player-header-info">
        <img src="@/assets/headshot-icon.jpg" alt="Headshot" class="player-header-headshot" />
        <h3 class="player-header-name">{{ getBatterName(selectedBatterPlays) }}</h3>
      </div>
      
      <div class="player-averages">
        <div class="player-average-box">
          <span>Exit Speed Avg</span>
          <strong>{{ getAvg(filteredPlays, 'EXIT_SPEED') }}</strong>
        </div>
        <div class="player-average-box">
          <span>Launch Angle Avg</span>
          <strong>{{ getAvg(filteredPlays, 'LAUNCH_ANGLE') }}</strong>
        </div>
        <div class="player-average-box">
          <span>Hit Distance Avg</span>
          <strong>{{ getAvg(filteredPlays, 'HIT_DISTANCE') }}</strong>
        </div>
        <div class="player-average-box">
          <span>Exit Direction Avg</span>
          <strong>{{ getAvg(filteredPlays, 'EXIT_DIRECTION') }}</strong>
        </div>
        <div class="player-average-box">
          <span>Spin Rate Avg</span>
          <strong>{{ getAvg(filteredPlays, 'HIT_SPIN_RATE') }}</strong>
        </div>
        <div class="player-average-box">
          <span>Hang Time Avg</span>
          <strong>{{ getAvg(filteredPlays, 'HANG_TIME') }}</strong>
        </div>
      </div>

      <div class="results-count">
        {{ filteredPlays.length }} of {{ selectedBatterPlays.length }} plays
      </div>
    </div>

    <!-- Selected Batter Info -->
    <div v-if="selectedBatterPlays.length">

    <!-- Shared Filter Section -->
    <div class="filters-section">
      <div class="filter-header">
        <h4>Filter Results</h4>
        <div class="filter-actions">
          <button @click="clearAllFilters" class="clear-filters-btn">Clear All Filters</button>
          <button @click="toggleFilterExpansion" class="expand-btn">
            {{ filterExpanded ? 'Collapse' : 'More Filters' }}
          </button>
        </div>
      </div>

      <!-- Always visible filters -->
      <div class="filters-primary">
        <div class="filter-group">
          <label>Date Range:</label>
          <div class="date-range-filter enhanced-date-range">
            <input
              v-model="filters.dateFrom"
              type="date"
              :max="filters.dateTo"
              placeholder="From"
              class="date-input"
            />
            <span class="date-separator">to</span>
            <input
              v-model="filters.dateTo"
              type="date"
              :min="filters.dateFrom"
              placeholder="To"
              class="date-input"
            />
          </div>
        </div>

        <div class="filter-group">
          <label>Pitcher:</label>
          <div class="searchable-select">
            <input
              v-model="pitcherSearch"
              type="text"
              placeholder="Search pitcher..."
              @focus="showPitcherDropdown = true"
              @blur="hidePitcherDropdown"
            />
            <div v-if="showPitcherDropdown" class="dropdown-options">
              <div
                v-for="pitcher in filteredPitchers"
                :key="pitcher"
                @click="selectPitcher(pitcher)"
                class="dropdown-option"
              >
                {{ pitcher }}
              </div>
            </div>
          </div>
        </div>

        <div class="filter-group">
          <label>Outcome:</label>
          <div class="multi-select">
            <div class="selected-outcomes" @click="toggleOutcomeDropdown">
              <span v-if="selectedOutcomes.length === 0">Select outcomes...</span>
              <span v-else>{{ selectedOutcomes.length }} selected</span>
              <span class="dropdown-arrow">▼</span>
            </div>
            <div v-if="showOutcomeDropdown" class="dropdown-options multi">
              <label
                v-for="outcome in uniqueValues('PLAY_OUTCOME')"
                :key="outcome"
                class="checkbox-option"
              >
                <input
                  type="checkbox"
                  :value="outcome"
                  v-model="selectedOutcomes"
                />
                {{ outcome }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Expandable advanced filters -->
      <div v-if="filterExpanded" class="filters-advanced">
        <div class="filter-divider">
          <span>Advanced Filters</span>
        </div>

        <div class="numeric-filters-grid">
          <div class="filter-group" v-for="key in numericFilterKeys" :key="key">
            <label>{{ formatLabel(key) }}:</label>
            <div class="numeric-filter">
              <div class="filter-row">
                <select v-model="numericFilters[key].operator" class="operator-select">
                  <option value="">Any</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value="=">=</option>
                  <option value="between">Between</option>
                </select>
                <input
                  v-if="numericFilters[key].operator !== 'between'"
                  v-model.number="numericFilters[key].value"
                  type="number"
                  :placeholder="getPlaceholder(key)"
                  step="0.1"
                />
              </div>
              <div v-if="numericFilters[key].operator === 'between'" class="range-inputs">
                <input
                  v-model.number="numericFilters[key].min"
                  type="number"
                  :placeholder="`Min ${formatLabel(key)}`"
                  step="0.1"
                />
                <span class="range-separator">to</span>
                <input
                  v-model.number="numericFilters[key].max"
                  type="number"
                  :placeholder="`Max ${formatLabel(key)}`"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active filters summary -->
      <div v-if="hasActiveFilters" class="filters-active-summary">
        <span class="summary-label">Active Filters:</span>
        <div class="active-filter-tags">
          <span v-if="filters.dateFrom || filters.dateTo" class="filter-tag">
            Date: {{ formatDateRange() }}
            <button @click="clearDateFilter" class="remove-tag">×</button>
          </span>
          <span v-if="selectedPitcher" class="filter-tag">
            Pitcher: {{ selectedPitcher }}
            <button @click="clearPitcherFilter" class="remove-tag">×</button>
          </span>
          <span v-if="selectedOutcomes.length > 0" class="filter-tag">
            Outcomes: {{ selectedOutcomes.length }}
            <button @click="clearOutcomeFilter" class="remove-tag">×</button>
          </span>
          <span
            v-for="(filter, key) in activeNumericFilters"
            :key="key"
            class="filter-tag"
          >
            {{ formatLabel(key) }}: {{ formatNumericFilter(filter) }}
            <button @click="clearNumericFilter(key)" class="remove-tag">×</button>
          </span>
        </div>
      </div>
    </div>

      <!-- Table -->
      <div class="table-wrapper-fixed" v-if="sortedPlays.length">
        <table class="fixed-header-table">
          <thead>
            <tr>
              <th @click="setSortColumn('BATTER')" class="sortable-header" :class="getSortClass('BATTER')">
                Batter
                <span v-if="sortColumn === 'BATTER'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '▲' : '▼' }}
                </span>
              </th>
              <th @click="setSortColumn('GAME_DATE')" class="sortable-header" :class="getSortClass('GAME_DATE')">
                Game Date
                <span v-if="sortColumn === 'GAME_DATE'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '▲' : '▼' }}
                </span>
              </th>
              <th @click="setSortColumn('PITCHER')" class="sortable-header" :class="getSortClass('PITCHER')">
                Pitcher
                <span v-if="sortColumn === 'PITCHER'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '▲' : '▼' }}
                </span>
              </th>
              <th @click="setSortColumn('PLAY_OUTCOME')" class="sortable-header" :class="getSortClass('PLAY_OUTCOME')">
                Outcome
                <span v-if="sortColumn === 'PLAY_OUTCOME'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '▲' : '▼' }}
                </span>
              </th>
              <th @click="setSortColumn('EXIT_SPEED')" class="sortable-header" :class="getSortClass('EXIT_SPEED')">
                Exit Speed
                <span v-if="sortColumn === 'EXIT_SPEED'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '▲' : '▼' }}
                </span>
              </th>
              <th @click="setSortColumn('LAUNCH_ANGLE')" class="sortable-header" :class="getSortClass('LAUNCH_ANGLE')">
                Launch Angle
                <span v-if="sortColumn === 'LAUNCH_ANGLE'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '▲' : '▼' }}
                </span>
              </th>
              <th @click="setSortColumn('HIT_DISTANCE')" class="sortable-header" :class="getSortClass('HIT_DISTANCE')">
                Hit Distance
                <span v-if="sortColumn === 'HIT_DISTANCE'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '▲' : '▼' }}
                </span>
              </th>
              <th @click="setSortColumn('HIT_SPIN_RATE')" class="sortable-header" :class="getSortClass('HIT_SPIN_RATE')">
                Spin Rate
                <span v-if="sortColumn === 'HIT_SPIN_RATE'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '▲' : '▼' }}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(play, index) in sortedPlays"
              :key="index"
              @click="selectPlay(play)"
              class="clickable-row"
              :class="{ 'selected-row': selectedPlay === play }"
            >
              <td>{{ play.BATTER }}</td>
              <td>{{ play.GAME_DATE }}</td>
              <td>{{ play.PITCHER }}</td>
              <td>{{ formatOutcome(play.PLAY_OUTCOME) }}</td>
              <td>{{ play.EXIT_SPEED?.toFixed(1) }}</td>
              <td>{{ play.LAUNCH_ANGLE?.toFixed(1) }}</td>
              <td>{{ play.HIT_DISTANCE?.toFixed(1) }}</td>
              <td>{{ play.HIT_SPIN_RATE?.toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="no-data-msg">No plays match current filters.</p>
    </div>

    <!-- Video -->
    <div v-if="selectedPlay" class="video-container">
      <video
        :src="selectedPlay.VIDEO_LINK"
        controls
        width="100%"
        style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  </div>
</template>

<script src="./BattersPage.js"></script>