import '../styles/LoadingScreen.css';
import LogoGua from '../../LogoMD.svg';

export default function LoadingScreen() {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <img src={LogoGua} alt="Loading..." className="loading-logo-bounce" />
                <div className="loading-bar">
                    <div className="loading-progress"></div>
                </div>
            </div>
        </div>
    );
}