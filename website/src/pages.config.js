/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import TestDashboard from './pages/TestDashboard';
import AdminContracts from './pages/AdminContracts';
import Apply from './pages/Apply';
import ParentDashboard from './pages/ParentDashboard';
import AdminStaffPortal from './pages/AdminStaffPortal';
import Home from './pages/Home';
import Login from './pages/Login';
import MyContracts from './pages/MyContracts';
import ParentContract from './pages/ParentContract';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import __Layout from './Layout.jsx';


// List of pages that should NOT be wrapped in the Layout (e.g. full-screen pages)
export const NO_LAYOUT_PAGES = ['Login', 'Apply'];

export const PAGES = {
    "TestDashboard": TestDashboard,
    "AdminContracts": AdminContracts,
    "Apply": Apply,
    "ParentDashboard": ParentDashboard,
    "AdminStaffPortal": AdminStaffPortal,
    "Home": Home,
    "Login": Login,
    "MyContracts": MyContracts,
    "ParentContract": ParentContract,
    "StaffDashboard": StaffDashboard,
    "AdminDashboard": AdminDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};