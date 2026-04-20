import './App.css';
import { useState, useEffect } from 'react';
import { useRoutes} from 'react-router';
import AboutPage from './pages/aboutPage';
import HomePage from './pages/homePage';
import FlowerDictionary from './pages/flowerDictionary';
import ScanAFlower from './pages/scanAFlower';
import FlowerGallery from './pages/flowerGallery';
import IndividualFlowerPage from './pages/individualFlowerPage';
import NavBar from './components/NavBar';
import Footer from './components/Footer';

const App = () => {
    const [flowers, setFlowers] = useState([]);

    useEffect(() => {
        fetch('/api/flowers')
            .then(response => response.json())
            .then(data => setFlowers(data))
            .catch(error => console.error('Error fetching flowers:', error));
    }, []);

    let element = useRoutes([
        { path: '/', element: <HomePage /> },
        { path: '/about', element: <AboutPage /> },
        { path: '/dictionary', element: <FlowerDictionary /> },
        { path: '/scan', element: <ScanAFlower /> },
        { path: '/gallery', element: <FlowerGallery /> },
        { path: '/gallery/:flowerId', element: <IndividualFlowerPage flowers={flowers} /> }

    ]);

    return (
        <div className="App">
            <NavBar />
            {element}
            <Footer />
        </div>
    )

}

export default App;

