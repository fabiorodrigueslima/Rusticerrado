import {
    FaTree,
    FaHandSparkles,
    FaShippingFast
} from 'react-icons/fa';

const iconMap = {
    'tree': FaTree,
    'hand': FaHandSparkles,
    'shipping': FaShippingFast
};

export default function FeatureCard({ icon, title, description }) {
    const IconComponent = iconMap[icon] || FaTree;

    return (
        <div className="feature-card">
            <div className="feature-icon">
                <IconComponent />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
}