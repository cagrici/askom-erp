import { combineReducers } from "redux";

// Front
import LayoutReducer from "./layouts/reducer";

// team
import TeamReducer from "./team/reducer";

//Calendar
import CalendarReducer from "./calendar/reducer";


// To do
import TodosReducer from "./todos/reducer";


// File Manager
import FileManagerReducer from "./fileManager/reducer";

//Project
import ProjectsReducer from "./projects/reducer";


//Mailbox
import MailboxReducer from "./mailbox/reducer";

//TicketsList
import TicketsReducer from "./tickets/reducer";

//Invoice
import InvoiceReducer from "./invoice/reducer";

// Tasks
import TasksReducer from "./tasks/reducer";

//Crm
import CrmReducer from "./crm/reducer";

// Messages
import MessageReducer from "./messageSlice";



const rootReducer = combineReducers({
    Layout: LayoutReducer,
    Team: TeamReducer,
    Calendar: CalendarReducer,


    Todos: TodosReducer,

    FileManager: FileManagerReducer,
    Projects: ProjectsReducer,

    Mailbox: MailboxReducer,
    Tickets: TicketsReducer,
    Invoice: InvoiceReducer,
    Tasks: TasksReducer,
    Crm: CrmReducer,
    messages: MessageReducer,

})

export default rootReducer;
