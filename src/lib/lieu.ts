// Le lieu d'un évènement est toujours un lien Google Maps (même règle côté API).
const LIEN_GOOGLE_MAPS =
    /^https:\/\/(?:(?:www\.)?google\.[a-z.]{2,6}\/maps|maps\.google\.[a-z.]{2,6}|maps\.app\.goo\.gl|goo\.gl\/maps)(?:[/?#]|$)/i;

function estLienGoogleMaps(valeur: string) {
    return LIEN_GOOGLE_MAPS.test(valeur.trim());
}

export { estLienGoogleMaps };
