import { toast } from 'react-toastify';
import axios from 'axios';
import {
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
    deleteTeamDataPending
} from './reducer';

interface QueryParams {
    search?: string;
    filter?: string;
    perPage?: number;
    page?: number;
}

// Get team data
export const onGetTeamData = (queryParams: QueryParams = {}) => async (dispatch: any) => {
    try {
        dispatch(getTeamDataPending());

        const params = new URLSearchParams();
        if (queryParams.search) params.append('search', queryParams.search);
        if (queryParams.filter) params.append('filter', queryParams.filter);
        if (queryParams.perPage) params.append('perPage', queryParams.perPage.toString());
        if (queryParams.page) params.append('page', queryParams.page.toString());

        const paramsString = params.toString() ? `?${params.toString()}` : '';
        const response = await axios.get(`/api/get-team-data${paramsString}`);

        dispatch(getTeamDataSuccess(response.data));
    } catch (error) {
        dispatch(getTeamDataFail(error));
        console.error("Error fetching team data:", error);
        toast.error("Failed to load team data");
    }
};

// Add team data
export const onAddTeamData = (teamData: any) => async (dispatch: any) => {
    try {
        dispatch(addTeamDataPending());
        const response = await axios.post('/api/team', teamData);
        dispatch(addTeamDataSuccess(response.data.member));
        toast.success(response.data.message || "Team member added successfully");
    } catch (error: any) {
        dispatch(addTeamDataFail(error));
        console.error("Error adding team member:", error);

        if (error.response && error.response.data && error.response.data.errors) {
            // Display validation errors
            const errorMessages = Object.values(error.response.data.errors).flat();
            errorMessages.forEach((message: any) => toast.error(message));
        } else {
            toast.error("Failed to add team member");
        }
    }
};

// Update team data
export const onUpdateTeamData = (teamData: any) => async (dispatch: any) => {
    try {
        dispatch(updateTeamDataPending());
        const response = await axios.put(`/api/team/${teamData.id}`, teamData);
        dispatch(updateTeamDataSuccess(teamData));
        toast.success(response.data.message || "Team member updated successfully");
    } catch (error: any) {
        dispatch(updateTeamDataFail(error));
        console.error("Error updating team member:", error);

        if (error.response && error.response.data && error.response.data.errors) {
            // Display validation errors
            const errorMessages = Object.values(error.response.data.errors).flat();
            errorMessages.forEach((message: any) => toast.error(message));
        } else {
            toast.error("Failed to update team member");
        }
    }
};

// Delete team data
export const onDeleteTeamData = (id: number) => async (dispatch: any) => {
    try {
        dispatch(deleteTeamDataPending());
        const response = await axios.delete(`/api/team/${id}`);
        dispatch(deleteTeamDataSuccess(id));
        toast.success(response.data.message || "Team member removed successfully");
    } catch (error) {
        dispatch(deleteTeamDataFail(error));
        console.error("Error deleting team member:", error);
        toast.error("Failed to remove team member");
    }
};
