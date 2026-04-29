const run = async (jobData) => {
	console.log("[TEST WORKER] Received job:", jobData);
	return { status: "success", data: jobData };
};

export default run;
