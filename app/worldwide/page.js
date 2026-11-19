// Worldwide: profissionais fora do Brasil, por país e cidade (cada cidade tem página própria, nos três idiomas).
import { Mundo, metaMundo } from '../../components/PaginaCidadeMundo.js';

export const revalidate = 3600;
export const metadata = metaMundo('pt');
export default function Worldwide() { return <Mundo l="pt" />; }
