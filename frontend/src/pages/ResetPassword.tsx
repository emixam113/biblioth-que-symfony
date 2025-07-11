


export default function ResetPassword() {
    return (
        <div>
            <h1 className="text-2xl underline text-center p-20 ">Réinitialisation de mot de passe</h1>
            <form className="text-center">
                <input type="email" placeholder="Email" className="border-2 rounded-lg p-2"/>
                <button className="rounded-full text-blue-500 underline p-5 gap-2">réinitialiser</button>
            </form>
        </div>
    )
}