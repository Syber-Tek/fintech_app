import { View } from 'react-native'
import React from 'react'


const StepIndicator = ({ currentStep }: { currentStep: number }) => {
    return (
        <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 20 }}>
            {[1, 2, 3, 4, 5].map((item) => (
                <View
                    key={item}
                    className={`${currentStep === item ? "bg-emerald-700" : "bg-gray-300"} rounded-full mx-0.5 w-5 h-2`}
                />
            ))}
        </View>
    );
};

export default StepIndicator