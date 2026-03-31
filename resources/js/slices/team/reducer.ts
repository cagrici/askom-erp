// slices/team/reducer.ts
import { createSlice } from "@reduxjs/toolkit";

interface TeamMember {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    employee_code: string;
    designation: string;
    projectCount: number;
    taskCount: number;
    userImage: string | null;
    backgroundImg: string;
    phoneNumber: string;
    location: string;
    isActive: boolean;
    joinDate: string | null;
    skills: string[];
}

interface TeamState {
    teamData: TeamMember[];
    loading: boolean;
    error: string | null;
    pagination: {
        current_page: number;
        total: number;
        per_page: number;
        last_page: number;
    };
}

export const initialState: TeamState = {
    teamData: [],
    loading: false,
    error: null,
    pagination: {
        current_page: 1,
        total: 0,
        per_page: 10,
        last_page: 1
    }
};

const TeamSlice = createSlice({
    name: 'Team',
    initialState,
    reducers: {
        // Get team data
        getTeamDataSuccess(state, action) {
            state.loading = false;
            state.teamData = action.payload.data;
            state.pagination = {
                current_page: action.payload.current_page,
                total: action.payload.total,
                per_page: action.payload.per_page,
                last_page: action.payload.last_page
            };
        },
        getTeamDataFail(state, action) {
            state.loading = false;
            state.error = action.payload;
        },
        getTeamDataPending(state) {
            state.loading = true;
        },

        // Add team data
        addTeamDataSuccess(state, action) {
            state.loading = false;
            state.teamData = [...state.teamData, action.payload];
        },
        addTeamDataFail(state, action) {
            state.loading = false;
            state.error = action.payload;
        },
        addTeamDataPending(state) {
            state.loading = true;
        },

        // Update team data
        updateTeamDataSuccess(state, action) {
            state.loading = false;
            state.teamData = state.teamData.map(team =>
                team.id === action.payload.id ? { ...team, ...action.payload } : team
            );
        },
        updateTeamDataFail(state, action) {
            state.loading = false;
            state.error = action.payload;
        },
        updateTeamDataPending(state) {
            state.loading = true;
        },

        // Delete team data
        deleteTeamDataSuccess(state, action) {
            state.loading = false;
            state.teamData = state.teamData.filter(team => team.id !== action.payload);
        },
        deleteTeamDataFail(state, action) {
            state.loading = false;
            state.error = action.payload;
        },
        deleteTeamDataPending(state) {
            state.loading = true;
        },

        // Clear error
        clearError(state) {
            state.error = null;
        }
    },
});

export const {
    getTeamDataSuccess,
    getTeamDataFail,
    getTeamDataPending,
    addTeamDataSuccess,
    addTeamDataFail,
    addTeamDataPending,
    updateTeamDataSuccess,
    updateTeamDataFail,
    updateTeamDataPending,
    deleteTeamDataSuccess,
    deleteTeamDataFail,
    deleteTeamDataPending,
    clearError
} = TeamSlice.actions;

export default TeamSlice.reducer;
