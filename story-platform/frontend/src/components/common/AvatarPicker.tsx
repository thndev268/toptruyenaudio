import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface AvatarPickerProps {
  currentAvatar?: string;
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

const AVATAR_LIST = [
  'user1.jpg',
  'user2.jpg',
  'user3.jpg',
  'user4.png',
  'user5.jpg',
  'user6.jpg',
  'user7.jpg',
  'user8.jpg',
  'user9.png',
  'user10.jpg',
];

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  currentAvatar,
  onSelect,
  onClose,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '');

  const handleSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    onSelect(avatar);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Chọn Avatar</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {AVATAR_LIST.map((avatar) => (
            <button
              key={avatar}
              onClick={() => handleSelect(avatar)}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                selectedAvatar === avatar
                  ? 'border-cyan-500 ring-2 ring-cyan-500/50'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <img
                src={`/avatars/${avatar}`}
                alt={avatar}
                className="w-full h-full object-cover"
              />
              {selectedAvatar === avatar && (
                <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-cyan-400" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
