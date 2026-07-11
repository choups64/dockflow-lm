interface SearchBarProps {
  placeholder?: string;
}

export default function SearchBar({
  placeholder = "Commande, EAN ou Réf LM...",
}: SearchBarProps) {
  return (
    <div className="w-full">
      <input
        type="text"
        placeholder={placeholder}
        className="
          w-full
          rounded-2xl
          border
          border-slate-700
          bg-slate-800
          px-5
          py-4
          text-white
          placeholder:text-slate-400
          focus:border-[#78BE20]
          focus:outline-none
          focus:ring-2
          focus:ring-[#78BE20]/30
          transition
        "
      />
    </div>
  );
}