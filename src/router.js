//router.js
import Home from './pages/Home.js';
import Stories from './pages/Stories.js';
import AddStory from './pages/AddStory.js';
import StoryDetail from './pages/StoryDetail.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';

export default function router(path) {
    switch(path) {
        case 'home':
            return Home();
        case 'stories':
            return Stories();
        case 'add':
            return AddStory();
        case 'detail':
            return StoryDetail();
        case 'login':
            return Login();
        case 'register':
            return Register();
        default:
            return Home();
    }
}