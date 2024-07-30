import { jwtDecode } from 'jwt-decode';
import styles from './page.module.css';

const decodeToken = (token: string) => {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
};

const renderTokenDetails = (decodedToken: Record<string, any> | null) => {
  if (!decodedToken) return null;

  return (
      <div className={styles['token-details']}>
      {Object.entries(decodedToken).map(([key, value]) => (
          <div key={key} className={styles['token-detail']}>
          <span className={styles['token-key']}>{key}:</span>
          <span className={styles['token-value']}>{String(value)}</span>
          </div>
      ))}
      </div>
  );
};

export { decodeToken, renderTokenDetails };
