import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import all pages
import Home from './pages/Home';
import AddBook from './pages/AddBook';
import ManageBooks from './pages/ManageBooks';
import Books from './pages/Books';
import Locations from './pages/Locations';

// Import responsive navigation component
import ResponsiveNav from './components/ResponsiveNav';

function App() {
  return (
    <Router>
      <ResponsiveNav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-book" element={<AddBook />} />
          <Route path="/manage-books" element={<ManageBooks />} />
          <Route path="/books" element={<Books />} />
          <Route path="/locations" element={<Locations />} />
        </Routes>
      </ResponsiveNav>
    </Router>
  );
}

export default App;