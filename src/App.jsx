import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import all pages
import AddBook from './pages/AddBook';
import ManageBooks from './pages/ManageBooks';
import Books from './pages/Books';
import Locations from './pages/Locations';
import Logs from './pages/Logs';

// Import responsive navigation component
import ResponsiveNav from './components/ResponsiveNav';

function App() {
  return (
    <Router>
      <ResponsiveNav>
        <Routes>
          <Route path="/" element={<Navigate to="/add-book" replace />} />
          <Route path="/add-book" element={<AddBook />} />
          <Route path="/manage-books" element={<ManageBooks />} />
          <Route path="/books" element={<Books />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </ResponsiveNav>
    </Router>
  );
}

export default App;