import { useEffect, useState } from "react";
import { Link } from "react-router";
import "../Pages_css/flowerGallery.css";

const FlowerGallery = () => {
  const [flowers, setFlowers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("flowerhuntToken");

  useEffect(() => {
    const loadGallery = async () => {
      if (!token) {
        setMessage("Please log in to view your flower gallery.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/users/gallery", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (!response.ok) {
          setMessage(data.error || "Could not load your gallery.");
          setIsLoading(false);
          return;
        }

        setFlowers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading gallery:", error);
        setMessage("Could not connect to the server.");
      } finally {
        setIsLoading(false);
      }
    };

    loadGallery();
  }, [token]);

  const removeFromGallery = async (flowerId) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/users/gallery/${encodeURIComponent(flowerId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Could not remove flower.");
        return;
      }
      setFlowers(Array.isArray(data.gallery) ? data.gallery : []);
    } catch (error) {
      console.error("Error removing gallery flower:", error);
      setMessage("Could not connect to the server.");
    }
  };

  return (
    <main className="flower-gallery-page">
      <h1 className="flower-gallery-title">My Flower Gallery</h1>

      {isLoading && <p className="flower-gallery-status">Loading your gallery...</p>}
      {!isLoading && message && <p className="flower-gallery-status">{message}</p>}
      {!isLoading && !message && flowers.length === 0 && (
        <p className="flower-gallery-status">You have not added any flowers yet.</p>
      )}

      <div className="flower-gallery-grid">
        {flowers.map((flower) => (
          <article key={flower.id} className="gallery-card">
            <Link to={`/discover/${flower.id}`} className="gallery-card-link">
              <div className="gallery-card-image">
                {flower.image_url ? (
                  <img src={flower.image_url} alt={flower.name} />
                ) : (
                  <span className="gallery-card-placeholder" aria-hidden="true">
                    🌸
                  </span>
                )}
              </div>
              <h2>{flower.name}</h2>
              {flower.flower_family && <p>{flower.flower_family}</p>}
            </Link>
            <button
              type="button"
              className="gallery-remove-btn"
              onClick={() => removeFromGallery(flower.id)}
            >
              Remove
            </button>
          </article>
        ))}
      </div>
    </main>
  );
};

export default FlowerGallery;
