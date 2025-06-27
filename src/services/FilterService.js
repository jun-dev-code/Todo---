import { FILTER_TYPES, SORT_TYPES } from '../constants/index.js';
import { Utils } from '../utils/index.js';

export class FilterService {
    constructor() {
        this.currentFilter = FILTER_TYPES.ALL;
        this.currentTagFilter = '';
        this.searchQuery = '';
        this.sortBy = SORT_TYPES.CREATED_DESC;
    }

    setFilter(filter) {
        if (!Object.values(FILTER_TYPES).includes(filter)) {
            throw new Error(`Invalid filter type: ${filter}`);
        }
        this.currentFilter = filter;
        return this;
    }

    setTagFilter(tag) {
        this.currentTagFilter = this.currentTagFilter === tag ? '' : tag;
        return this;
    }

    setSearchQuery(query) {
        this.searchQuery = Utils.sanitizeInput(query);
        return this;
    }

    setSortBy(sortBy) {
        if (!Object.values(SORT_TYPES).includes(sortBy)) {
            throw new Error(`Invalid sort type: ${sortBy}`);
        }
        this.sortBy = sortBy;
        return this;
    }

    clearFilters() {
        this.currentFilter = FILTER_TYPES.ALL;
        this.currentTagFilter = '';
        this.searchQuery = '';
        return this;
    }

    filterTasks(tasks) {
        let filtered = [...tasks];

        // Filter by status
        switch (this.currentFilter) {
            case FILTER_TYPES.ACTIVE:
                filtered = filtered.filter(t => !t.completed);
                break;
            case FILTER_TYPES.COMPLETED:
                filtered = filtered.filter(t => t.completed);
                break;
            case FILTER_TYPES.OVERDUE:
                filtered = filtered.filter(t => t.isOverdue());
                break;
            // ALL case - no filtering needed
        }

        // Filter by tag
        if (this.currentTagFilter) {
            filtered = filtered.filter(t => t.tags.includes(this.currentTagFilter));
        }

        // Filter by search query
        if (this.searchQuery) {
            filtered = filtered.filter(t => t.matchesSearch(this.searchQuery));
        }

        return this.sortTasks(filtered);
    }

    sortTasks(tasks) {
        const sorted = [...tasks];
        
        switch (this.sortBy) {
            case SORT_TYPES.CREATED_ASC:
                return sorted.sort((a, b) => a.createdAt - b.createdAt);
            case SORT_TYPES.CREATED_DESC:
                return sorted.sort((a, b) => b.createdAt - a.createdAt);
            case SORT_TYPES.DEADLINE_ASC:
                return sorted.sort((a, b) => {
                    if (!a.deadline && !b.deadline) return 0;
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline) - new Date(b.deadline);
                });
            case SORT_TYPES.DEADLINE_DESC:
                return sorted.sort((a, b) => {
                    if (!a.deadline && !b.deadline) return 0;
                    if (!a.deadline) return -1;
                    if (!b.deadline) return 1;
                    return new Date(b.deadline) - new Date(a.deadline);
                });
            case SORT_TYPES.NAME_ASC:
                return sorted.sort((a, b) => a.text.localeCompare(b.text));
            case SORT_TYPES.NAME_DESC:
                return sorted.sort((a, b) => b.text.localeCompare(a.text));
            case SORT_TYPES.STATUS_ASC:
                return sorted.sort((a, b) => a.completed - b.completed);
            case SORT_TYPES.STATUS_DESC:
                return sorted.sort((a, b) => b.completed - a.completed);
            default:
                return sorted;
        }
    }

    getFilterState() {
        return {
            filter: this.currentFilter,
            tagFilter: this.currentTagFilter,
            searchQuery: this.searchQuery,
            sortBy: this.sortBy
        };
    }

    setFilterState(state) {
        if (state.filter) this.setFilter(state.filter);
        if (state.tagFilter) this.setTagFilter(state.tagFilter);
        if (state.searchQuery) this.setSearchQuery(state.searchQuery);
        if (state.sortBy) this.setSortBy(state.sortBy);
        return this;
    }
}