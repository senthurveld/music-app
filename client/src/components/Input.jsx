// eslint-disable-next-line no-unused-vars
const Input = ({ icon: Icon, ...props }) => {
  return (
    <div className="relative mb-6">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Icon className="size-5 text-green-500" />
      </div>
      <input
        {...props}
        className="w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-green-500 hover:border-gray-600
 text-white placeholder-gray-400 transition outline-0 duration-200"
      />
    </div>
  );
};

export default Input;
