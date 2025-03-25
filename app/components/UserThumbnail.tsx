import React, { useState } from 'react';
import Image from 'next/image';
import { FaUser } from 'react-icons/fa';

export interface UserThumbnailProps {
  userId: string;
  size: 'small' | 'medium' | 'large' | number;
  className?: string;
  onClick?: () => void;
}

const getSizeInPixels = (size: 'small' | 'medium' | 'large' | number): number => {
  if (typeof size === 'number') {
    return size;
  }
  
  switch (size) {
    case 'small':
      return 32;
    case 'medium':
      return 48;
    case 'large':
      return 64;
    default:
      return 48;
  }
};

const UserThumbnail: React.FC<UserThumbnailProps> = ({ 
  userId, 
  size, 
  className = '', 
  onClick 
}) => {
  const [imageError, setImageError] = useState(false);
  const sizeInPixels = getSizeInPixels(size);
  
  // Generate avatar URL using DiceBear Avataaars API
  const avatarUrl = `https://avatars.dicebear.com/api/avataaars/${userId}.svg?w=${sizeInPixels}&h=${sizeInPixels}`;
  
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div 
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{ width: sizeInPixels, height: sizeInPixels }}
      onClick={onClick}
    >
      {!imageError ? (
        <Image
          src={avatarUrl}
          alt="User avatar"
          width={sizeInPixels}
          height={sizeInPixels}
          onError={handleImageError}
          className="object-cover"
        />
      ) : (
        <div 
          className="flex items-center justify-center bg-gray-200 w-full h-full"
        >
          <FaUser 
            size={sizeInPixels * 0.6} 
            className="text-gray-500" 
          />
        </div>
      )}
    </div>
  );
};

export default UserThumbnail;