import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import "../Pages_css/individualFlowerPage.css";

const detailsRows = [
  ["Scientific Name", "scientific_name"],
  ["Family", "flower_family"],
  ["Order", "order"],
  ["Genus", "genus"],
  ["Species", "species"],
  ["Flower Colors", "flower_colors"],
  ["Flower Conspicuous", "flower_array"],
  ["Bloom Months", "bloom_months"],
  ["Growth Habit", "growth_habit"],
  ["Flower Meaning", "flower_meaning"],
];

const fallbackFlower = {
  id: "sample",
  name: "Flower Name",
  description: "Flower details will appear here once a flower is selected.",
  image_url: "",
};

const formatDetailValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) {
    if (!value.length) return null;
    const normalized = value
      .map((item) => formatDetailValue(item))
      .filter((item) => item !== null);
    return normalized.length ? normalized.join(", ") : null;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    if (typeof value.name === "string" && value.name.trim()) return value.name;
    if (typeof value.common_name === "string" && value.common_name.trim()) return value.common_name;
    if (typeof value.scientific_name === "string" && value.scientific_name.trim()) return value.scientific_name;
    if (typeof value.slug === "string" && value.slug.trim()) return value.slug;
    return null;
  }
  return String(value);
};

const IndividualFlowerPage = ({ flowers = [] }) => {
  const { flowerId } = useParams();
  const [flowerFromApi, setFlowerFromApi] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInGallery, setIsInGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [galleryMessage, setGalleryMessage] = useState("");

  const flowerFromList = useMemo(
    () => flowers.find((flower) => String(flower.id) === String(flowerId)),
    [flowers, flowerId]
  );

  useEffect(() => {
    if (flowerFromList || !flowerId) {
      return;
    }

    const loadFlower = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/flowers/${flowerId}`);
        if (!response.ok) {
          setFlowerFromApi(null);
          return;
        }
        const data = await response.json();
        setFlowerFromApi(data);
      } catch (error) {
        console.error("Error fetching individual flower:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFlower();
  }, [flowerFromList, flowerId]);

  useEffect(() => {
    const token = localStorage.getItem("flowerhuntToken");
    if (!token || !flowerId) {
      setIsInGallery(false);
      return;
    }

    const loadGalleryStatus = async () => {
      try {
        const response = await fetch("/api/users/gallery", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const gallery = await response.json();
        setIsInGallery(
          Array.isArray(gallery) &&
            gallery.some((flower) => String(flower.id) === String(flowerId))
        );
      } catch (error) {
        console.error("Error loading gallery status:", error);
      }
    };

    loadGalleryStatus();
  }, [flowerId]);

  const activeFlower = flowerFromList || flowerFromApi || fallbackFlower;
  const visibleDetails = detailsRows
    .map(([label, key]) => ({ label, value: formatDetailValue(activeFlower[key]), key }))
    .filter((row) => row.value !== null);
  const isLoggedIn = Boolean(localStorage.getItem("flowerhuntToken"));

  const handleAddToGallery = async () => {
    const token = localStorage.getItem("flowerhuntToken");
    if (!token) {
      setGalleryMessage("Please log in to save flowers to your gallery.");
      return;
    }

    setIsSaving(true);
    setGalleryMessage("");
    try {
      const response = await fetch("/api/users/gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: activeFlower.id || flowerId,
          name: activeFlower.name || "Unknown Flower",
          image_url: activeFlower.image_url || null,
          flower_family: activeFlower.flower_family || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setGalleryMessage(data.error || "Could not save flower to your gallery.");
        return;
      }

      setIsInGallery(true);
      setGalleryMessage("Added to your flower gallery.");
    } catch (error) {
      console.error("Error adding flower to gallery:", error);
      setGalleryMessage("Could not connect to the server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="individual-flower-page">
      <section className="flower-hero">
        <div className="flower-layout">
          <div className="flower-main-column">
            <h1 className="flower-title">{activeFlower.name || "Flower Name"}</h1>
            <div className="primary-flower-image">
              {activeFlower.image_url ? (
                <img src={activeFlower.image_url} alt={activeFlower.name} />
              ) : (
                <span className="image-fallback-icon" aria-hidden="true">
                  🖼️
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="flower-details-section">
        <h2>Flower Details</h2>
        <div className="gallery-action-row">
          <button
            type="button"
            className="gallery-action-btn"
            disabled={!isLoggedIn || isInGallery || isSaving}
            onClick={handleAddToGallery}
          >
            {isInGallery ? "Saved in Your Gallery" : isSaving ? "Saving..." : "Add to My Gallery"}
          </button>
          {!isLoggedIn && (
            <p className="gallery-action-note">Log in to save flowers to your gallery.</p>
          )}
          {galleryMessage && <p className="gallery-action-note">{galleryMessage}</p>}
        </div>
        {isLoading && <p className="flower-note">Loading flower details...</p>}
        {!isLoading && activeFlower.description && (
          <p className="flower-note">{activeFlower.description}</p>
        )}
        {!isLoading && !activeFlower.description && visibleDetails.length === 0 && (
          <p className="flower-note">No detailed information is available for this flower yet.</p>
        )}

        <div className="flower-details-grid">
          {visibleDetails.map(({ label, key, value }) => (
            <p key={key} className="detail-item">
              <span>{label}:</span> {value}
            </p>
          ))}
        </div>
      </section>
    </main>
  );
};

export default IndividualFlowerPage;
