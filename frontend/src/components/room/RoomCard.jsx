import { BedDouble, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function RoomCard({ room }) {
  const navigate = useNavigate();
  const roomKey = room?.slug || room?.id;

  return (
    <article className="room-card">
      <div className="room-card-image-wrap">
        {room.image
          ? <img src={room.image} alt={room.name} className="room-card-image" />
          : <div className="room-card-image room-card-image-placeholder" role="img" aria-label={`${room.name} image not available`} />}
      </div>
      <div className="room-card-body">
        <div className="room-card-topline">
          <span>{room.category}</span>
          <strong>₹{room.price}</strong>
        </div>
        <h3>{room.name}</h3>
        <p>{room.description}</p>
        <ul className="room-meta">
          <li><BedDouble size={16} /> {room.bed}</li>
          <li><Users size={16} /> Up to {room.occupancy} guests</li>
        </ul>
        <div className="room-amenities">
          {room.amenities.slice(0, 3).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="room-actions">
          <Link to={`/rooms/${roomKey}`} className="btn btn-secondary">View Details</Link>
          <button type="button" className="btn btn-primary" onClick={() => navigate(`/booking?category=${encodeURIComponent(roomKey)}`)}>
            Book Now
          </button>
        </div>
      </div>
    </article>
  );
}

export default RoomCard;
