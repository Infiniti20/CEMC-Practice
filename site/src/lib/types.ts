type Question = {
    question: string,
    answers: string[],
    solutions:{
        solution: string,
        ans:string
    },
    topics?:{
        primaryTopics: number[] ,
        secondaryTopics: number[] 
    },
    source:{
        year:number,
        number:number
    }
}
type ContestFile = {
    data: Question[],
    legend: {
        [key:string]: number
    }
}

type ContestDirectory = {
    [key:string]: ContestFile
}