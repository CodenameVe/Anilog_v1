import React from "react";

const StarRating = ({ rating = 0, setRating }) => {
     const isInteractive = !!setRating; 

  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
       <button
        key={star}
        type="button"
        onClick={() => setRating(star)}>
        {star <= rating ? "★" : "☆"}
      </button>
      ))}
    </div>
  )
}


export default StarRating