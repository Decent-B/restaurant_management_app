import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [rating, setRating] = useState<string | null>(null);
  const [comment, setComment] = useState<string>("");
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const ratingMap: Record<string, number> = {
    "😠": 1,
    "🙁": 2,
    "😐": 3,
    "🙂": 4,
    "😄": 5,
  };
  const orderId = 123;

  const handleSubmit = async () => {
    if (!rating) {
      alert("Please select a rating!");
      return;
    }

    const payload = {
      order: orderId,
      rating: ratingMap[rating],
      comment: comment,
    };

    try {
      const { reviewsAPI } = await import('../api/endpoints');
      await reviewsAPI.submitFeedback(payload);
      alert("Thank you for your feedback!");
      setSubmitted(true);
    } catch (error: any) {
      alert(`Failed to submit feedback: ${error.message || 'An error occurred'}`);
      console.error(error);
    }
  };

  return (
    <Layout title="Feedback">
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center px-4 py-12">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-xl w-full">
          {!submitted ? (
            <>
              {!rating ? (
                <>
                  <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">We value your feedback!</h2>
                  <p className="text-center text-gray-600 mb-6">How would you rate your experience?</p>

                  <div className="flex justify-around mb-6">
                    {["😠", "🙁", "😐", "🙂", "😄"].map((face) => (
                      <button
                        key={face}
                        className="text-4xl transition hover:scale-110"
                        onClick={() => setRating(face)}
                      >
                        {face}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {!showFollowUp ? (
                    <>
                    <h4 className="font-medium text-sm text-gray-800 text-center mb-4">
                    {rating === "😄" || rating === "🙂"
                      ? "Great! Can you share your thoughts with us?"
                      : "We're sorry. Can you tell us what's wrong?"}
                    </h4>
                    <div className="flex justify-center gap-4">
                      <button
                        className="bg-white px-6 py-2 rounded-full shadow text-gray-700"
                        onClick={handleSubmit}  // "No, thank you!" submits feedback directly
                      >
                        No, thank you!
                      </button>
                      <button
                        className="bg-[#1e2a59] text-white px-6 py-2 rounded-full shadow"
                        onClick={() => setShowFollowUp(true)}
                      >
                        Yes, of course!
                      </button>
                    </div>
                    </>
                  ) : (
                    <>
                      <textarea
                        placeholder="Tell us more..."
                        className="w-full p-4 border border-gray-500 rounded-lg resize-none mb-4 h-32 mt-6 text-gray-700"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <button
                        onClick={handleSubmit}
                        className="w-full bg-[#1e2a59] text-white font-semibold py-3 rounded-lg hover:bg-[#2c3e75] transition"
                      >
                        Submit Feedback
                      </button>
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-green-600 mb-2">🎉 Thank you! 🎉</h3>
              <p className="text-gray-700">We appreciate your feedback and will use it to improve our service.</p>
              <button
                onClick={() => navigate("/")}
                className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full"
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
