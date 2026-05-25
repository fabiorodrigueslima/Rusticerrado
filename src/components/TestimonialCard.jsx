export default function TestimonialCard({ stars, text, author }) {
    return (
        <div className="testimonial-card">
            <div className="stars">
                {stars}
            </div>

            <p className="testimonial-text">
                "{text}"
            </p>

            <strong className="testimonial-author">
                - {author}
            </strong>
        </div>
    );
}