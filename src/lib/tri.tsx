import { TableCell, TableCellProps, TableSortLabel } from '@mui/material';
import { ReactNode, useMemo, useState } from 'react';

type valeurTriType = string | number | boolean | null | undefined;
type directionType = 'asc' | 'desc';

const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });

function comparer(a: valeurTriType, b: valeurTriType) {
    if (typeof a === 'string' && typeof b === 'string') return collator.compare(a, b);
    return Number(a) - Number(b);
}

function estVide(v: valeurTriType) {
    return v === null || v === undefined || v === '';
}

// Tri d'un tableau par colonne : cliquer un en-tête trie, recliquer inverse le sens.
function useTri<T, cleT extends string>(
    lignes: T[],
    colonnes: Record<cleT, (ligne: T) => valeurTriType>,
    initial?: { cle: NoInfer<cleT>; direction?: directionType },
) {
    const [tri, setTri] = useState<{ cle: cleT; direction: directionType } | undefined>(
        initial ? { cle: initial.cle, direction: initial.direction ?? 'asc' } : undefined,
    );

    const triees = useMemo(() => {
        if (!tri || !colonnes[tri.cle]) return lignes;
        const valeur = colonnes[tri.cle];
        const signe = tri.direction === 'asc' ? 1 : -1;
        // Tri stable : à égalité, l'ordre d'origine est conservé.
        return lignes
            .map((ligne, index) => ({ ligne, index, v: valeur(ligne) }))
            .sort((a, b) => {
                // Valeurs vides toujours en dernier, quel que soit le sens.
                if (estVide(a.v) || estVide(b.v)) {
                    return estVide(a.v) === estVide(b.v) ? a.index - b.index : estVide(a.v) ? 1 : -1;
                }
                return signe * comparer(a.v, b.v) || a.index - b.index;
            })
            .map(({ ligne }) => ligne);
    }, [lignes, tri, colonnes]);

    // En-tête cliquable d'une colonne triable.
    const enTete = (cle: cleT, libelle: ReactNode, cellProps: Omit<TableCellProps, 'children'> = {}) => {
        const actif = tri?.cle === cle;
        const direction = actif ? tri.direction : 'asc';
        return (
            <TableCell key={cle} sortDirection={actif ? direction : false} {...cellProps}>
                <TableSortLabel
                    active={actif}
                    direction={direction}
                    onClick={() => setTri({ cle, direction: actif && direction === 'asc' ? 'desc' : 'asc' })}
                >
                    {libelle}
                </TableSortLabel>
            </TableCell>
        );
    };

    return { lignes: triees, enTete };
}

export { useTri };
