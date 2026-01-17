import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

function ProfileCard({ profile }) {
    const { id, name, balance } = profile;
    const isLocked = balance < 0; // Using < 0 for negative, technically original code said <= 0 isLocked, but let's stick to simple Red/Green

    return (
        <Link to={`/profile/${id}`} style={{ textDecoration: 'none' }}>
            <div className="card" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                marginBottom: 0 // handled by parent gap
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Minimal Avatar / Initials */}
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: profile.photoURL ? 'transparent' : 'var(--bg-app)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        {profile.photoURL ? (
                            <img src={profile.photoURL} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                        ) : (
                            <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-secondary)' }}>{name.charAt(0)}</span>
                        )}
                    </div>

                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {name}
                        </h3>
                        <span style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: balance < 0 ? 'var(--accent-danger)' : 'var(--accent-success)',
                            letterSpacing: '0.02em',
                            marginTop: '2px',
                            display: 'block'
                        }}>
                            {balance} min
                        </span>
                    </div>
                </div>

                <ChevronRight size={20} color="var(--text-muted)" />
            </div>
        </Link>
    );
}

export default ProfileCard;
