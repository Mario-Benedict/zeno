interface Props {
  text: string;
}

const LlmUserTurn = ({ text }: Props) => (
  <div className="flex justify-end">
    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-dark-surface-3 px-4 py-2.5 text-sm leading-relaxed text-dark-primary">
      <p className="whitespace-pre-wrap">{text}</p>
    </div>
  </div>
);

export default LlmUserTurn;
