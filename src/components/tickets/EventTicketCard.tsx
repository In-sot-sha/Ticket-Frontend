import React from 'react';
import QRCode from 'qrcode.react';
import { resolveTicketStyle } from '../../data/ticketDesigns';

export interface EventTicketCardProps {
  eventName: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  eventImageUrl?: string;
  ticketType?: {
    name?: string;
    ticketStyle?: string | null;
    accentColor?: string | null;
    badgeText?: string | null;
    ticketHeadline?: string | null;
    venueLabel?: string | null;
  };
  ticketSerial?: string;
  qrValue?: string;
  qrCodeImage?: string | null;
  compact?: boolean;
  id?: string;
}

function formatTicketDate(dateString: string) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate();
    const ordinals = ['th', 'st', 'nd', 'rd'];
    const v = day % 100;
    const suffix = ordinals[(v - 20) % 10] || ordinals[v] || ordinals[0];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${day}${suffix} | ${months[date.getMonth()].toUpperCase()} | ${date.getFullYear()}`;
  } catch {
    return dateString;
  }
}

function splitTitle(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) return { firstWord: title, restOfTitle: '' };
  return { firstWord: words[0], restOfTitle: words.slice(1).join(' ') };
}

const EventTicketCard: React.FC<EventTicketCardProps> = ({
  eventName,
  eventDate,
  eventTime = '7:00 PM',
  eventLocation = 'Venue TBA',
  eventImageUrl,
  ticketType,
  ticketSerial = 'TKT-PREVIEW',
  qrValue = 'preview-ticket',
  qrCodeImage,
  compact = false,
  id,
}) => {
  const style = resolveTicketStyle(ticketType);
  const split = splitTitle(eventName);
  const formattedDate = formatTicketDate(eventDate);
  const bannerImage =
    eventImageUrl ||
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80';

  return (
    <div
      id={id}
      className={`relative w-full flex flex-col md:flex-row bg-neutral-900 border ${style.borderColor} rounded-2xl overflow-hidden shadow-lg group ${compact ? 'max-w-md' : ''}`}
    >
      <div className={`relative flex-1 ${compact ? 'p-4 min-h-[160px]' : 'p-4 sm:p-8 min-h-[190px] sm:min-h-[250px]'} flex flex-col justify-between overflow-hidden text-white`}>
        <div className="absolute inset-0 z-0">
          <img
            src={bannerImage}
            alt={eventName}
            className="w-full h-full object-cover brightness-90 saturate-110"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 to-black/35 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />
        </div>

        <div className="relative z-20 flex flex-col justify-between h-full">
          <div>
            <p className="text-[9px] font-black tracking-[0.25em] text-neutral-300 uppercase opacity-95">
              {ticketType?.ticketHeadline?.trim() || 'COME AND JOIN'}
            </p>
            <h3 className={`${compact ? 'text-lg' : 'text-xl sm:text-3xl'} font-extrabold tracking-tight leading-none mt-2 uppercase drop-shadow-md`}>
              <span style={{ color: style.accent }}>{split.firstWord}</span>{' '}
              <span className="text-white">{split.restOfTitle}</span>
            </h3>
          </div>

          <div className="mt-3">
            <p className="text-[8px] font-black tracking-widest text-neutral-400">
              {ticketType?.venueLabel?.trim() || 'LIVE AT'}
            </p>
            <h4 className={`${compact ? 'text-xs' : 'text-sm sm:text-base'} font-black tracking-tight text-white uppercase mt-0.5 line-clamp-1`}>
              {eventLocation}
            </h4>
          </div>

          <div className="mt-4 border-t border-white/10 pt-2 flex flex-wrap gap-x-4 text-[9px] text-white/70">
            <div>
              <span className="text-[8px] font-bold text-neutral-400 block">TIME</span>
              <p className="font-extrabold text-white uppercase mt-0.5">{eventTime}</p>
            </div>
            <div className="border-l border-white/10 pl-3">
              <span className="text-[8px] font-bold text-neutral-400 block">DATE</span>
              <p className="font-extrabold text-white uppercase mt-0.5">{formattedDate}</p>
            </div>
            {!compact && (
              <div className="border-l border-white/10 pl-3">
                <span className="text-[8px] font-bold text-neutral-400 block">CODE</span>
                <p className="font-extrabold text-white uppercase mt-0.5">{ticketSerial}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="hidden md:flex flex-col justify-between items-center py-4 relative bg-neutral-900 shrink-0">
        <div className="w-6 h-6 rounded-full bg-neutral-50 dark:bg-neutral-950 border -mt-6 -mr-3 z-30" />
        <div className="border-l-2 border-dashed border-neutral-700 h-full my-2" />
        <div className="w-6 h-6 rounded-full bg-neutral-50 dark:bg-neutral-950 border -mb-6 -mr-3 z-30" />
      </div>

      <div
        className={`w-full md:w-52 ${compact ? 'p-3' : 'p-4 sm:p-6'} flex flex-row md:flex-col justify-between items-center relative shrink-0 text-black`}
        style={{ backgroundColor: style.sideBg }}
      >
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />

        <span className="relative px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase bg-black text-white mb-0 md:mb-3 shadow-sm">
          {style.badgeLabel}
        </span>

        <div className="relative bg-white p-2 rounded-xl shadow-md">
          {qrCodeImage ? (
            <img src={qrCodeImage} alt="QR" className={`${compact ? 'w-14 h-14' : 'w-20 h-20 md:w-24 md:h-24'} object-contain`} />
          ) : (
            <QRCode value={qrValue} size={compact ? 56 : 80} renderAs="svg" />
          )}
        </div>

        <div className="relative text-right md:text-center mt-0 md:mt-3">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-85">SCAN TO ENTRY</p>
          <p className="text-[7px] opacity-60 mt-0.5">ADMIT ONE</p>
        </div>
      </div>
    </div>
  );
};

export default EventTicketCard;
