export function validateObservable(statement) {

    const errors = [];

    const text = statement.toLowerCase();


    /* ----------------------------------
       Construct Leakage
    ---------------------------------- */

    const forbiddenConstructWords = [
        "understand",
        "knows",
        "learning",
        "ability",
        "mastery",
        "comprehension",
        "proficiency"
    ];

    forbiddenConstructWords.forEach(word => {

        if (text.includes(word)) {

            errors.push(
                "Observable contains latent construct language."
            );

        }

    });


    /* ----------------------------------
       Measurable Action Check
    ---------------------------------- */

    const measurableActions = [
        "identify",
        "select",
        "compute",
        "classify",
        "construct",
        "produce",
        "justify",
        "explain",
        "compare",
        "analyze"
    ];


    const hasAction = measurableActions.some(action =>
        text.includes(action)
    );


    if (!hasAction) {

        errors.push(
            "Observable must include a measurable action."
        );

    }


    /* ----------------------------------
       Context Check
    ---------------------------------- */

    const contextWords = [
        "when",
        "while",
        "for",
        "in",
        "during"
    ];


    const hasContext = contextWords.some(c =>
        text.includes(c)
    );


    if (!hasContext) {

        errors.push(
            "Observable should specify task context."
        );

    }


    return errors;

}