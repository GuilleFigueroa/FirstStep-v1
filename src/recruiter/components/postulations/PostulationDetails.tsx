import { Postulation } from './PostulationsTable';

interface Props {
  postulation: Postulation;
  onBack: () => void;
}

export function PostulationDetails({ postulation, onBack }: Props) {
  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-bold">{postulation.jobTitle}</h2>
      <p>Empresa: {postulation.company}</p>
      <p>Departamento: {postulation.department}</p>
      <p>Estado: {postulation.status}</p>
      <button
        onClick={onBack}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Volver
      </button>
    </div>
  );
}
