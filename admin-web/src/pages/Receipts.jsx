import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Receipts() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Collections page with receipts tab active
    navigate('/collections?tab=receipts', { replace: true });
  }, [navigate]);

  return null;
}
